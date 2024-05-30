//usersController.js
const User = require('../models/User')
const Clip = require('../models/Clip')
const asyncHandler = require('express-async-handler') 
const bcrypt = require('bcrypt') // password hashing 


// @desc Get all users
// @router Get /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    users = await User.find().select('-password').lean()
    if(!users.length) {
        return res.status(400).json({ message: 'No users found'})
    }
    res.json(users)
})





// @desc Update new users
// @router Patch /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    
})


// @desc Delete new users
// @router DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    
})


module.exports = {
    getAllUsers,
    signUpUser,
    updateUser,
    deleteUser
}