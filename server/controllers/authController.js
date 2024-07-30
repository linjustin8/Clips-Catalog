// authController.js

const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const authAccess = require("../middleware/verifyJWT");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// @desc Helper function
const authUser = async (res, user, status, message) => {
  const userInfo = {
    id: user._id,
    username: user.username,
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
      secure: true, //https
      sameSite: "None", //cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    })
    .status(status)
    .json({ UserInfo: userInfo, accessToken: accessToken});
};

// @desc Signup new users
// @router POST /signup
// @access Public
const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // confirm data
  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // check for duplicates
  const duplicate = await User.findOne({ username }).lean().exec();
  if (duplicate) {
    return res.status(400).json({ message: "Duplicate username" });
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
// @router POST /login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ username }).exec();

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(401).json({ message: "Unauthorized" });

  await authUser(res, user, 200, `Logged in user ${username}`);
});

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            id: foundUser._id,
            username: foundUser.username,
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
// @route POST /auth/logout
// @access Private
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.sendStatus(204).json({ message: "No user found" }); //No content
  }
  res
    .clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })
    .json({ message: "Cookie cleared" });
};

// @desc verifies if the user is logged in
// @route GET /users/me
// @access Private
const verifyAuth = asyncHandler(async (req, res) => {
  await authAccess(req, res, () => {
    const user = {
      id: req.userId,
      username: req.username,
      roles: req.roles,
    }
    res.json({ user });
  });
});

module.exports = {
  signup,
  login,
  refresh,
  logout,
  verifyAuth,
};
