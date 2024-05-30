const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email : {
        type: String, 
        required: true
    },
    uuid: {
        type: String,
        default: uuidv4, 
        unique: true 
    },
    password: {
        type: String,
        required: true
    },
    roles: [{
        type: String,
        default: "Viewer"
    }],
})

userSchema.statics.signup = async () => {
    
}

module.exports = mongoose.model('User', userSchema)