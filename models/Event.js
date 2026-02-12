const mongoose = require('mongoose')
const Schema = mongoose.Schema

const eventSchema = new mongoose.Schema({
    eventDate: {
        type: String,
        maxlength: 10,
        match: /^\d{4}-\d{2}-\d{2}$/ // Format YYYY-MM-DD
    },
    fullEventDate: {
        type: Date,
        required: true
    },
    titre: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    statut: {
        type: Number,
        enum: [0, 1], // 0 = inactif, 1 = actif
        default: 1
    }
}, {
    collection: 'events',
    timestamps: true
})

// Index pour améliorer les performances
eventSchema.index({ fullEventDate: -1 })
eventSchema.index({ statut: 1 })

const Event = mongoose.model('Event', eventSchema)

module.exports = Event

