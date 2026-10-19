// clipRoutes.js
const express = require("express");
const router = express.Router();
const clipsController = require("../controllers/clipsController");
const verifyJWT = require("../middleware/verifyJWT");

// Public feed. Pass ?limit=12&cursor=<nextCursor> for lazy loading.
router.get("/recent", clipsController.getRecentClips);

// Authenticated clip management.
router.get("/mine", verifyJWT, clipsController.getUserClips);
router.post(
  "/upload-url",
  verifyJWT,
  clipsController.createUploadUrl
);
router.post(
  "/complete",
  verifyJWT,
  clipsController.completeUpload
);
router.delete("/:clipId", verifyJWT, clipsController.remove);

module.exports = router;
