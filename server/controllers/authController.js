// authController.js

const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const authAccess = require("../middleware/verifyJWT");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// @desc Sets user data after logging in or signing up
const authUser = async (res, user, status, message) => {
  const userInfo = {
    id: String(user._id),
    username: user.username,
    email: user.email,
    roles: user.roles,
  };

  const accessToken = jwt.sign(
    {
      UserInfo: userInfo,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { username: user.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res
    .cookie("jwt", refreshToken, {
      httpOnly: true, //accessible only by web server
      secure: false, //false for development (http -> https)
      // sameSite: "None", //cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    })
    .status(status)
    .json({ accessToken: accessToken });
  console.log({ accessToken: accessToken });
};

// @desc Signup new users/
// @router POST /user/signup
// @access Public
const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const errors = []
  
  // confirm data
  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // check for duplicates
  const existingUser = await User.findOne({ username }).lean().exec();
  if (existingUser) {
    errors.push("Username")
  }
    
  const existingEmail = await User.findOne({ email }).lean().exec();
  if (existingEmail) {
    errors.push(" Email")
  }

  if (errors.length) {
    return res.status(400).json({errors: errors})
  }
  
  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // 10 salt rounds
  const userObject = { username: username, email: email, password: hashedPwd };

  // create and store user object
  const user = await User.create(userObject);

  if (user) {
    await authUser(res, user, 201, `Created user ${username}`);
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

// @desc Login existing users
// @router POST /user/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ email }).exec();

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(401).json({ message: "Incorrect password" });
  console.log(user.username);

  await authUser(res, user, 200, `Logged in user ${user.username}`);
});

// @desc Refresh
// @route GET /user/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;
  
  if (!cookies?.jwt) {
    return res.status(401).json({ message: "Unauthorized - no cookies found" });
  }
    
  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();

      if (!foundUser)
        return res
          .status(401)
          .json({ message: "Unauthorized - user not found" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            id: foundUser._id,
            username: foundUser.username,
            email: foundUser.email,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    }
  );
};

// @desc Logout user by just clearing cookies
// @route POST /user/logout
// @access Private
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.sendStatus(204).json({ message: "No user found" });
  }
  res.clearCookie("jwt", { 
    httpOnly: true, 
    // sameSite: "None", 
    secure: false })
  .json({ message: "Cookie cleared" }); //No content
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
};
