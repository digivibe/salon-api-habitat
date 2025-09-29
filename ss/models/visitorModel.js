const mongoose = require('mongoose')

const visitorSchema = new mongoose.Schema({
    cookie: {
        type: String,
        required: true,
        unique: true
    },
    addressIp: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        required: true
    },
    countVisite: {
        type: Number,
        default: 1
    }
}, { collection: 'visitors', timestamps: true })

module.exports = mongoose.model('Visitor', visitorSchema)