// clipsController.js
const path = require("path");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Clip = require("../models/Clip");
const AWS = require("aws-sdk");
const asyncHandler = require("express-async-handler");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const bucket = process.env.S3_BUCKET_NAME;
const configuredMaxFileSizeMb = Number.parseInt(
  process.env.MAX_CLIP_SIZE_MB,
  10
);
const MAX_FILE_SIZE_MB =
  Number.isFinite(configuredMaxFileSizeMb) && configuredMaxFileSizeMb > 0
    ? configuredMaxFileSizeMb
    : 100;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
]);

const validateS3Config = () => {
  if (!bucket || !process.env.AWS_REGION) {
    const error = new Error("S3 is not configured");
    error.status = 500;
    throw error;
  }
};

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(parsed, MAX_PAGE_SIZE);
};

const encodeCursor = (clip) =>
  Buffer.from(
    JSON.stringify({
      date: clip.uploadDate.toISOString(),
      id: clip._id.toString(),
    })
  ).toString("base64url");

const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    const date = new Date(decoded.date);

    if (Number.isNaN(date.getTime()) || !mongoose.isValidObjectId(decoded.id)) {
      throw new Error();
    }

    return { date, id: new mongoose.Types.ObjectId(decoded.id) };
  } catch {
    const error = new Error("Invalid pagination cursor");
    error.status = 400;
    throw error;
  }
};

const addCursorFilter = (filter, cursor) => {
  if (!cursor) return filter;

  return {
    ...filter,
    $or: [
      { uploadDate: { $lt: cursor.date } },
      { uploadDate: cursor.date, _id: { $lt: cursor.id } },
    ],
  };
};

const getPlaybackUrl = async (clip) => {
  if (!clip.s3Key) return clip.s3Url;

  return s3.getSignedUrlPromise("getObject", {
    Bucket: bucket,
    Key: clip.s3Key,
    Expires: 60 * 60,
  });
};

const serializeClips = (clips) =>
  Promise.all(
    clips.map(async (clip) => ({
      ...clip.toObject(),
      playbackUrl: await getPlaybackUrl(clip),
    }))
  );

const getClipPage = async (filter, query) => {
  validateS3Config();
  const limit = parseLimit(query.limit);
  const cursor = decodeCursor(query.cursor);
  const clips = await Clip.find(addCursorFilter(filter, cursor))
    .sort({ uploadDate: -1, _id: -1 })
    .limit(limit + 1)
    .exec();
  const hasMore = clips.length > limit;
  const page = hasMore ? clips.slice(0, limit) : clips;

  return {
    clips: await serializeClips(page),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
    hasMore,
  };
};

// The client uploads the file directly to this URL with an HTTP PUT request.
const createUploadUrl = asyncHandler(async (req, res) => {
  validateS3Config();
  const { filename, contentType, fileSize } = req.body;
  const size = Number(fileSize);

  if (typeof filename !== "string" || !ALLOWED_VIDEO_TYPES.has(contentType)) {
    return res
      .status(400)
      .json({ message: "A filename and supported video type are required" });
  }

  if (!Number.isFinite(size) || size < 1 || size > MAX_FILE_SIZE) {
    return res.status(400).json({
      message: `File size must be between 1 byte and ${MAX_FILE_SIZE_MB} MB`,
      maxFileSizeBytes: MAX_FILE_SIZE,
    });
  }

  const extension = path
    .extname(filename)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
  const key = `clips/${req.userId}/${uuidv4()}${extension}`;
  const uploadUrl = await s3.getSignedUrlPromise("putObject", {
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Expires: 5 * 60,
  });

  res.json({
    uploadUrl,
    key,
    expiresIn: 300,
    maxFileSizeBytes: MAX_FILE_SIZE,
    method: "PUT",
    headers: { "Content-Type": contentType },
  });
});

// Called after the direct-to-S3 PUT succeeds to persist the clip metadata.
const completeUpload = asyncHandler(async (req, res) => {
  validateS3Config();
  const { key, title, categories = [] } = req.body;
  const expectedPrefix = `clips/${req.userId}/`;

  if (
    typeof key !== "string" ||
    !key.startsWith(expectedPrefix) ||
    typeof title !== "string" ||
    !title.trim()
  ) {
    return res.status(400).json({ message: "A valid upload key and title are required" });
  }

  if (
    !Array.isArray(categories) ||
    categories.some((category) => typeof category !== "string")
  ) {
    return res
      .status(400)
      .json({ message: "Categories must be an array of strings" });
  }

  const existingClip = await Clip.findOne({ s3Key: key }).exec();
  if (existingClip) {
    return res.status(409).json({ message: "This upload has already been completed" });
  }

  let object;
  try {
    object = await s3.headObject({ Bucket: bucket, Key: key }).promise();
  } catch (error) {
    if (error.code === "NotFound" || error.statusCode === 404) {
      return res.status(400).json({ message: "The uploaded file was not found" });
    }
    throw error;
  }

  if (!ALLOWED_VIDEO_TYPES.has(object.ContentType)) {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    return res.status(400).json({ message: "The uploaded object is not a supported video" });
  }

  if (
    !Number.isFinite(object.ContentLength) ||
    object.ContentLength < 1 ||
    object.ContentLength > MAX_FILE_SIZE
  ) {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    return res.status(400).json({
      message: `The uploaded video must be no larger than ${MAX_FILE_SIZE_MB} MB`,
      maxFileSizeBytes: MAX_FILE_SIZE,
    });
  }

  const clip = await Clip.create({
    title: title.trim(),
    uploader: req.userId,
    categories: categories.map((category) => category.trim()).filter(Boolean),
    s3Key: key,
    contentType: object.ContentType,
    fileSize: object.ContentLength,
  });

  const [serializedClip] = await serializeClips([clip]);
  res.status(201).json({ clip: serializedClip });
});

const getUserClips = asyncHandler(async (req, res) => {
  res.json(await getClipPage({ uploader: req.userId }, req.query));
});

const getRecentClips = asyncHandler(async (req, res) => {
  res.json(await getClipPage({}, req.query));
});

const remove = asyncHandler(async (req, res) => {
  validateS3Config();

  if (!mongoose.isValidObjectId(req.params.clipId)) {
    return res.status(400).json({ message: "Invalid clip ID" });
  }

  const clip = await Clip.findOne({
    _id: req.params.clipId,
    uploader: req.userId,
  }).exec();

  if (!clip) {
    return res.status(404).json({ message: "Clip not found" });
  }

  if (clip.s3Key) {
    await s3.deleteObject({ Bucket: bucket, Key: clip.s3Key }).promise();
  }

  await clip.deleteOne();
  res.json({ message: "Clip deleted" });
});

module.exports = {
  createUploadUrl,
  completeUpload,
  getUserClips,
  getRecentClips,
  remove,
};
