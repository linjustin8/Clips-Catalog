const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const path = require("node:path");

// Load the actual handlers with isolated storage dependencies; no AWS or DB calls.
function setup(objectSize = 1, { clips = [], users = [], storageError = null } = {}) {
  const commands = [];
  const userQueries = [];
  let selectedUserFields;
  let created = false;
  class HeadObjectCommand { constructor(input) { this.input = input; } }
  class DeleteObjectCommand { constructor(input) { this.input = input; } }
  class PutObjectCommand { constructor(input) { this.input = input; } }
  class GetObjectCommand { constructor(input) { this.input = input; } }
  class S3Client {
    async send(command) {
      commands.push(command);
      if (command instanceof DeleteObjectCommand && storageError) throw storageError;
      if (command instanceof HeadObjectCommand) return { ContentType: "video/mp4", ContentLength: objectSize };
      return {};
    }
  }
  const dependencies = {
    path,
    mongoose: { isValidObjectId: (value) => /^[a-f\d]{24}$/i.test(value) },
    uuid: { v4: () => "test-id" },
    "../models/Clip": {
      findOne: (filter) => ({ exec: async () => clips.find((clip) => Object.entries(filter).every(([key, value]) => String(clip[key]) === String(value))) ?? null }),
      find: () => ({
        sort() { return this; },
        limit() { return this; },
        exec: async () => clips,
      }),
      create: async () => { created = true; throw new Error("Unexpected database write"); },
    },
    "../models/User": {
      find: (query) => {
        userQueries.push(query);
        return {
          select(fields) { selectedUserFields = fields; return this; },
          lean() { return this; },
          exec: async () => users,
        };
      },
    },
    "@aws-sdk/client-s3": { S3Client, HeadObjectCommand, DeleteObjectCommand, PutObjectCommand, GetObjectCommand },
    "@aws-sdk/s3-request-presigner": { getSignedUrl: async () => "https://s3.invalid/test" },
    "express-async-handler": (handler) => handler,
    dotenv: { config() {} },
  };
  const context = {
    require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    module: { exports: {} },
    process: { env: { AWS_REGION: "test-region", S3_BUCKET_NAME: "test-bucket" } },
    Buffer,
  };
  runInNewContext(readFileSync(path.join(__dirname, "clipsController.js"), "utf8"), context);
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return { handlers: context.module.exports, res, commands, DeleteObjectCommand, wasCreated: () => created, userQueries, selectedUserFields: () => selectedUserFields };
}

test("signing rejects prepared files larger than 100 MB", async () => {
  const { handlers, res } = setup();
  await handlers.createUploadUrl({ userId: "user", body: { filename: "clip.mp4", contentType: "video/mp4", fileSize: 100 * 1024 * 1024 + 1 } }, res);
  assert.equal(res.statusCode, 400);
});

test("signing accepts the exact 100 MB boundary", async () => {
  const { handlers, res } = setup();
  await handlers.createUploadUrl({ userId: "user", body: { filename: "clip.mp4", contentType: "video/mp4", fileSize: 100 * 1024 * 1024 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.maxFileSizeBytes, 100 * 1024 * 1024);
  assert.equal(res.body.uploadUrl, "https://s3.invalid/test");
});

test("completion rejects and removes an oversized S3 object before saving metadata", async () => {
  const { handlers, res, commands, DeleteObjectCommand, wasCreated } = setup(100 * 1024 * 1024 + 1);
  await handlers.completeUpload({ userId: "user", body: { key: "clips/user/clip.mp4", title: "Clip" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(wasCreated(), false);
  assert.equal(commands.filter((command) => command instanceof DeleteObjectCommand).length, 1);
});

const clipId = "123456789012345678901234";
const makeClip = (overrides = {}) => ({
  _id: clipId, uploader: "owner", s3Key: "clips/owner/video.mp4",
  title: "Test clip", uploadDate: new Date("2026-10-19T12:00:00Z"),
  toObject() { return { _id: this._id, uploader: this.uploader, title: this.title, uploadDate: this.uploadDate }; },
  ...overrides,
});

test("clip responses preserve owner IDs and expose only uploader display names", async () => {
  const state = setup(1, {
    clips: [makeClip(), makeClip({ _id: "223456789012345678901234" })],
    users: [{ _id: "owner", username: "clip-maker", email: "private@example.invalid", password: "secret-hash" }],
  });
  await state.handlers.getRecentClips({ query: {} }, state.res);
  assert.equal(state.res.body.clips[0].uploader, "owner");
  assert.equal(state.res.body.clips[0].uploaderUsername, "clip-maker");
  assert.equal(state.res.body.clips[1].uploaderUsername, "clip-maker");
  assert.equal(state.userQueries.length, 1);
  assert.equal(state.userQueries[0]._id.$in.length, 1);
  assert.equal(state.selectedUserFields(), "_id username");
  assert.equal(JSON.stringify(state.res.body).includes("private@example.invalid"), false);
  assert.equal(JSON.stringify(state.res.body).includes("secret-hash"), false);
});

test("clips with a missing uploader account remain readable", async () => {
  const { handlers, res } = setup(1, { clips: [makeClip()] });
  await handlers.getRecentClips({ query: {} }, res);
  assert.equal(res.body.clips[0].uploaderUsername, null);
  assert.equal(res.body.clips[0].uploader, "owner");
});

test("the owner can delete the S3 video and then the database record", async () => {
  let deleted = false;
  const state = setup(1, { clips: [makeClip({ deleteOne: async () => {
    assert.ok(state.commands[0] instanceof state.DeleteObjectCommand);
    deleted = true;
  } })] });
  await state.handlers.remove({ userId: "owner", params: { clipId } }, state.res);
  assert.equal(state.res.statusCode, 200);
  assert.equal(deleted, true);
  assert.equal(state.commands[0].input.Key, "clips/owner/video.mp4");
});

test("another user cannot delete the clip, even with an admin role", async () => {
  const state = setup(1, { clips: [makeClip({ deleteOne: async () => assert.fail("must not delete") })] });
  await state.handlers.remove({ userId: "other", roles: ["admin"], params: { clipId } }, state.res);
  assert.equal(state.res.statusCode, 404);
  assert.equal(state.commands.length, 0);
});

test("failed S3 deletion preserves the database record for retry", async () => {
  const state = setup(1, {
    clips: [makeClip({ deleteOne: async () => assert.fail("must preserve metadata") })],
    storageError: new Error("Storage unavailable"),
  });
  await assert.rejects(state.handlers.remove({ userId: "owner", params: { clipId } }, state.res), /Storage unavailable/);
});

test("invalid and missing clip IDs cannot delete storage objects", async () => {
  for (const [id, status] of [["invalid", 400], [clipId, 404]]) {
    const state = setup();
    await state.handlers.remove({ userId: "owner", params: { clipId: id } }, state.res);
    assert.equal(state.res.statusCode, status);
    assert.equal(state.commands.length, 0);
  }
});
