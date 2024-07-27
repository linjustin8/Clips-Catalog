const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: {
    type: [String],
    default: ["Viewer"],
  },
  signupDate: {
    type: Date,
    default: Date.now,
  }
});

userSchema.statics.signup = async () => {};

module.exports = mongoose.model("User", userSchema);
