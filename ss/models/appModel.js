const mongoose = require('mongoose')

const appSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
    statut: {
        type: Number,
        enum: [0, 1],
        default: 1
    }
}, { collection: 'apps' })

module.exports = mongoose.model('App', appSchema)