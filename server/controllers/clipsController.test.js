const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const path = require("node:path");

// Load the actual handlers with isolated storage dependencies; no AWS or DB calls.
function setup(objectSize = 1) {
  const commands = [];
  let created = false;
  class HeadObjectCommand { constructor(input) { this.input = input; } }
  class DeleteObjectCommand { constructor(input) { this.input = input; } }
  class PutObjectCommand { constructor(input) { this.input = input; } }
  class S3Client {
    async send(command) {
      commands.push(command);
      if (command instanceof HeadObjectCommand) return { ContentType: "video/mp4", ContentLength: objectSize };
      return {};
    }
  }
  const dependencies = {
    path,
    mongoose: {},
    uuid: { v4: () => "test-id" },
    "../models/Clip": {
      findOne: () => ({ exec: async () => null }),
      create: async () => { created = true; throw new Error("Unexpected database write"); },
    },
    "@aws-sdk/client-s3": { S3Client, HeadObjectCommand, DeleteObjectCommand, PutObjectCommand },
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
  return { handlers: context.module.exports, res, commands, DeleteObjectCommand, wasCreated: () => created };
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
