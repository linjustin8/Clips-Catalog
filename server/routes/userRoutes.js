// userRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const requireTrustedOrigin = require("../middleware/requireTrustedOrigin");

router.post("/signup", requireTrustedOrigin, authController.signup);
router.post("/login", requireTrustedOrigin, authController.login);
router.post("/logout", requireTrustedOrigin, authController.logout);
router.post("/refresh", requireTrustedOrigin, authController.refresh);


module.exports = router;
