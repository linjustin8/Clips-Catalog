// verifyJWT.js

const jwt = require("jsonwebtoken");
require("dotenv").config();

const authAccess = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
     res.status(401).json({ message: "Failed to authenticate token" });
    }
    
    req.userId = decoded.userInfo.userId;
    req.userRoles = decoded.userInfo.userRoles;
    next();
  });
};

module.exports = authAccess;