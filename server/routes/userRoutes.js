// userRoutes.js

const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/me", authController.verifyAuth);
router.post("/logout", authController.logout);

router
  .route("/")
  .get(usersController.getAllUsers)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;
