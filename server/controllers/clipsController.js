// clipsController.js
const Clip = require("../models/Clip");
const AWS = require("aws-sdk");
const asyncHandler = require("express-async-handler");
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

const upload = asyncHandler(async (req, res) => {
  const { title, category } = req.body;
  const file = req.file;
  const uploader = req.userId;
  
  if (!file) {
    return res.status(400).send({ message: 'No file uploaded or file type not allowed.' });
  }
  
  const key = `videos/${Date.now()}_${path.basename(file.originalname)}`;
  
  checkDuration(file.buffer, 30, (err) => {
    if (err) {
      return res.status(400).send({ message: "Upload failed", error: err.message });
    }
      
    storeClip(file.buffer, key, async (err, data) => {
      if (err) {
        return res.status(400).send({ message: "Upload failed", error: err.message });
      }

      const s3Url = `https://${data.bucket}.s3.amazonaws.com/${data.key}`;

      const clip = new Clip({
        title,
        uploader,
        category,
        s3Url,
      });

      await clip.save();
      res.send({
        message: 'File uploaded and compressed successfully',
        url: s3Url,
        clipId: clip._id,
      });
    });
  });
});

const remove = ();

const updateCategories = ();

module.exports = {
    upload,
    remove,
    updateCategories
};
