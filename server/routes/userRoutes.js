const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')

router.route('/')
    .get(usersController.getAllUsers)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

router.post('/signup', usersController.signUpUser)
router.post('/login', usersController.loginUser)

module.exports = router