const mongoose = require('mongoose')

const clipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    uploader: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    category: [{
        type: String,
        default: ""
    }],
})

module.exports = mongoose.model('Clip', clipSchema)