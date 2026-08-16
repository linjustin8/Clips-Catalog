const User = require("../models/User");
const RefreshSession = require("../models/RefreshSession");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const { createHash, randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_REUSE_GRACE_MS = 10 * 1000;
const REFRESH_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-refreshToken"
    : "refreshToken";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/user",
  maxAge: REFRESH_TOKEN_LIFETIME_MS,
};

const refreshCookieClearOptions = {
  httpOnly: refreshCookieOptions.httpOnly,
  secure: refreshCookieOptions.secure,
  sameSite: refreshCookieOptions.sameSite,
  path: refreshCookieOptions.path,
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieClearOptions);
  res.clearCookie("jwt", refreshCookieClearOptions);
};

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const createAccessToken = (user) =>
  jwt.sign(
    {
      UserInfo: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

const createRefreshToken = (user) =>
  jwt.sign({ username: user.username }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
    jwtid: randomUUID(),
    subject: String(user._id),
  });

const saveRefreshSession = (userId, refreshToken, familyId = randomUUID()) =>
  RefreshSession.create({
    user: userId,
    familyId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS),
  });

const authUser = async (res, user, status) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  await saveRefreshSession(user._id, refreshToken);

  res
    .clearCookie("jwt", refreshCookieClearOptions)
    .cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions)
    .set("Cache-Control", "no-store")
    .status(status)
    .json({ accessToken });
};

// @desc Signup new users
// @route POST /api/user/signup
// @access Public
const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = await User.findOne({ username }).lean().exec();
  if (existingUser) errors.push("Username");

  const existingEmail = await User.findOne({ email }).lean().exec();
  if (existingEmail) errors.push("Email");

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const hashedPwd = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email,
    password: hashedPwd,
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid user data received" });
  }

  await authUser(res, user, 201);
});

// @desc Login existing users
// @route POST /api/user/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ email }).exec();
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  await authUser(res, user, 200);
});

// @desc Rotate a refresh session and issue a new access token
// @route POST /api/user/refresh
// @access Public (requires refresh cookie)
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized - no cookie found" });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    clearRefreshCookie(res);
    return res.status(403).json({ message: "Invalid refresh session" });
  }

  const session = await RefreshSession.findOne({
    tokenHash: hashToken(refreshToken),
  }).exec();

  if (!session || session.expiresAt <= new Date()) {
    clearRefreshCookie(res);
    return res.status(403).json({ message: "Invalid refresh session" });
  }

  if (session.revokedAt) {
    if (Date.now() - session.revokedAt.getTime() <= REFRESH_REUSE_GRACE_MS) {
      return res.status(409).json({ message: "Refresh already in progress" });
    }

    await RefreshSession.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    clearRefreshCookie(res);
    return res.status(403).json({ message: "Refresh token reuse detected" });
  }

  const foundUser = await User.findById(session.user).exec();
  if (!foundUser || String(foundUser._id) !== decoded.sub) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Unauthorized - user not found" });
  }

  const nextRefreshToken = createRefreshToken(foundUser);
  const nextTokenHash = hashToken(nextRefreshToken);
  const rotatedSession = await RefreshSession.findOneAndUpdate(
    { _id: session._id, revokedAt: null },
    {
      $set: {
        revokedAt: new Date(),
        replacedByTokenHash: nextTokenHash,
      },
    }
  ).exec();

  if (!rotatedSession) {
    const latestSessionState = await RefreshSession.findById(session._id).exec();
    if (
      latestSessionState?.revokedAt &&
      Date.now() - latestSessionState.revokedAt.getTime() <=
        REFRESH_REUSE_GRACE_MS
    ) {
      return res.status(409).json({ message: "Refresh already in progress" });
    }

    await RefreshSession.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    clearRefreshCookie(res);
    return res.status(403).json({ message: "Refresh token reuse detected" });
  }

  await saveRefreshSession(
    foundUser._id,
    nextRefreshToken,
    session.familyId
  );

  res
    .cookie(REFRESH_COOKIE_NAME, nextRefreshToken, refreshCookieOptions)
    .set("Cache-Control", "no-store")
    .json({ accessToken: createAccessToken(foundUser) });
});

// @desc Revoke the current refresh session and clear its cookie
// @route POST /api/user/logout
// @access Public (requires refresh cookie)
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    return res.sendStatus(204);
  }

  await RefreshSession.updateOne(
    { tokenHash: hashToken(refreshToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  clearRefreshCookie(res);
  res.json({ message: "Session ended" });
});

module.exports = {
  signup,
  login,
  refresh,
  logout,
};
