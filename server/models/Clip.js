const mongoose = require("mongoose");

const clipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  categories: [
    {
      type: String,
      default: "",
    },
  ],
  s3Key: {
    type: String,
    unique: true,
    sparse: true,
  },
  s3Url: {
    type: String,
  },
  contentType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
});

clipSchema.index({ uploadDate: -1, _id: -1 });
clipSchema.index({ uploader: 1, uploadDate: -1, _id: -1 });

module.exports = mongoose.model("Clip", clipSchema);
