const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    eventDate: {
        type: String,
        maxlength: 10
    },
    fullEventDate: {
        type: String,
        required: true
    },
    titre: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 256
    },
    statut: {
        type: Number,
        enum: [0, 1],
        default: 1
    }
}, { collection: 'events' })

module.exports = mongoose.model('Event', eventSchema)