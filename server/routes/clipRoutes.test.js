const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const path = require("node:path");
const jwt = require("jsonwebtoken");
const express = require("express");

const secret = "upload-permissions-test-secret";

function loadModule(filename, dependencies, env = {}) {
  const context = {
    module: { exports: {} },
    process: { env },
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  };
  runInNewContext(readFileSync(filename, "utf8"), context);
  return context.module.exports;
}

function requestUpload(endpoint, token, method = "POST") {
  // Exercise the real router and JWT verification without AWS, MongoDB, or
  // sockets. Stub only the controller work after authentication succeeds.
  const verifyJWT = loadModule(path.join(__dirname, "../middleware/verifyJWT.js"), {
    jsonwebtoken: jwt,
    dotenv: { config() {} },
  }, { ACCESS_TOKEN_SECRET: secret });
  const complete = (req, res) => res.json({ uploader: req.userId });
  const router = loadModule(path.join(__dirname, "clipRoutes.js"), {
    express,
    "../middleware/verifyJWT": verifyJWT,
    "../middleware/requireRole": require("../middleware/requireRole"),
    "../controllers/clipsController": {
      createUploadUrl: complete, completeUpload: complete,
      getRecentClips: complete, getUserClips: complete, remove: complete,
    },
  });
  return new Promise((resolve, reject) => {
    const req = { method, url: endpoint, headers: token ? { authorization: `Bearer ${token}` } : {} };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body }); },
    };
    router.handle(req, res, (error) => reject(error || new Error("Upload handler was not reached")));
  });
}

test("deletion requires a valid signed-in account", async () => {
  for (const token of [undefined, "invalid-token"]) {
    assert.equal((await requestUpload("/123456789012345678901234", token, "DELETE")).status, 401);
  }
  const token = jwt.sign({ UserInfo: { id: "owner", roles: ["Viewer"] } }, secret);
  const response = await requestUpload("/123456789012345678901234", token, "DELETE");
  assert.equal(response.status, 200);
  assert.equal(response.body.uploader, "owner");
});

for (const endpoint of ["/upload-url", "/complete"]) {
  for (const role of ["Viewer", "admin"]) {
    test(`${endpoint} allows signed-in ${role} accounts`, async () => {
      const token = jwt.sign({ UserInfo: { id: "test-user", roles: [role] } }, secret);
      const response = await requestUpload(endpoint, token);
      assert.equal(response.status, 200);
      assert.equal(response.body.uploader, "test-user");
    });
  }

  test(`${endpoint} rejects guests and invalid tokens`, async () => {
    for (const token of [undefined, "invalid-token"]) {
      assert.equal((await requestUpload(endpoint, token)).status, 401);
    }
  });
}
