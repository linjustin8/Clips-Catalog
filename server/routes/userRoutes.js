// userRoutes.js

const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const authController = require("../controllers/authController");

router
  .route("/")
  .get(usersController.getAllUsers)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

router.post("/signup", authController.signup);
router.post("/login", authController.login);

module.exports = router;
