// clipsController.js
const Clip = require("../modelss/Clip");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");


AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mov/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      file.originalname.split(".").pop().toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .mp4 and .mov files are supported"), false);
    }
  },
});


module.exports = {
    
}