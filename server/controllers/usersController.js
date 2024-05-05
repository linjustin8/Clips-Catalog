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


// @desc Create new users
// @router POST /users
// @access Private

const createNewUser = asyncHandler(async (req, res) => {
    const { username, uuid, password, roles} = req.body
    
    // confirm data
    if (!username || !password || !uuid || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: 'All fields are required' })
    }
    
    // check for duplicates
    const duplicate = await User.findOne( {username} ).lean().exec()
    if (duplicate) {
        return res.status(400).json({ message: 'Duplicate username' })
    }
    
    // Hash password
    const hashedPwd = await bcrypt.hash(password, 10) // 10 salt rounds
    const userObject = { username, uuid, "password": hashedPwd, roles}
    
    // create and store user object
    const user = await User.create(userObject)
    if (user) {
        res.status(201).json({ message: `New user ${username} created` })
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }
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
    createNewUser,
    updateUser,
    deleteUser
}