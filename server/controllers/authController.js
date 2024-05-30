// authController.js

const User = require('../models/User')
const Clip = require('../models/Clip')
const asyncHandler = require('express-async-handler') 
const bcrypt = require('bcrypt') // password hashing 


// @desc Sign up new users
// @router POST /signup
// @access Public
const signUpUser = asyncHandler(async (req, res) => {
    const { username, email, uuid, password, roles} = req.body
    
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

// @desc Login existing users
// @router POST /login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
    
})