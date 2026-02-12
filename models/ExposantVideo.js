const mongoose = require('mongoose')
const Schema = mongoose.Schema

const exposantVideoSchema = new mongoose.Schema({
    salon: {
        type: Schema.Types.ObjectId,
        ref: 'Salon',
        required: true,
        index: true
    },
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    videoUrl: {
        type: String,
        required: true,
        maxlength: 500
    },
    thumbnailUrl: {
        type: String,
        maxlength: 500
    },
    statut: {
        type: Number,
        enum: [0, 1], // 0 = inactif, 1 = actif
        default: 1
    }
}, {
    collection: 'exposantvideos',
    timestamps: true
})

// Index pour améliorer les performances
exposantVideoSchema.index({ salon: 1, exposantId: 1 })
exposantVideoSchema.index({ salon: 1, statut: 1 })
exposantVideoSchema.index({ salon: 1, createdAt: -1 })

const ExposantVideo = mongoose.model('ExposantVideo', exposantVideoSchema)

module.exports = ExposantVideo

