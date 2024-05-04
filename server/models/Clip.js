const mongoose = require('mongoose')

const clipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: [{
        type: String,
        default: ""
    }],
})

module.exports = mongoose.model('Clip', clipSchema)