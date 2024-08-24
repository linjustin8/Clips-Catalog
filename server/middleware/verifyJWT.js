// verifyJWT.js

const jwt = require("jsonwebtoken");
require("dotenv").config();

const authAccess = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  console.log(authHeader);
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  console.log(jwt.decode(token));
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Failed to authenticate token", err: err });
    }

    req.userId = decoded.UserInfo.id;
    req.username = decoded.UserInfo.username;
    req.email = decoded.UserInfo.email;
    req.roles = decoded.UserInfo.roles;
    next();
  });
};

module.exports = authAccess;