// clipsController.js
const Clip = require("../models/Clip");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
require ("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const checkDuration = (buffer, maxDuration, callback) => {
  const convertedStream = streamifier.createReadStream(buffer);
  
  ffmpeg.ffprobe(convertedStream, (err, metadata) => {
    if (err) {
      console.error("Error probing clip: ", err);
      callback(err);
    } else {
      const duration = metadata.format.duration;
      if (duration > maxDuration) {
        callback(new Error(`Clip duration exceeds maximum of ${maxDuration} seconds.`));
      } else {
        callback(null);
      }
    }
  }); 
};

const storeClip = (buffer, key, callback) => {
  const convertedStream = streamifier.createReadStream(buffer);
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: null,
    ACL: "public-read",
    ContentType: "video/mp4"
  };
  
  ffmpeg(convertedStream)
    .outputOptions([
      "-movflags frag_keyframe+empty_moov",
      "-b:v 1000k",
      "-b:a 128k",
      "-vf scale=1920:-2",
      "-r 24",
      "-vcodec libx264"
    ])
    .format("mp4")
    .on("end", () => {
      console.log("Compression finished.");
    })
    .on("error", (err) => {
      console.error('Compression error: ', err);
      callback(err);
    })
    .pipe(s3.upload({ ...uploadParams }).createReadStream())
    .on('error', (err) => {
      console.error('Upload error: ', err);
      callback(err);
    })
    .on('finish', () => {
      console.log('Upload finished');
      callback(null, { key, bucket: process.env.S3_BUCKET_NAME });
    });
};


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

const remove = ();

const updateCategories = ();

module.exports = {
    upload,
    remove,
    updateCategories
};
