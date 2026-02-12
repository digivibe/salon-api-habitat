const mongoose = require('mongoose')
const Schema = mongoose.Schema

const exposantBondealSchema = new mongoose.Schema({
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
    image: {
        type: String,
        required: true,
        maxlength: 500
    },
    title: {
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
    collection: 'exposantbondeals',
    timestamps: true
})

// Index pour améliorer les performances
exposantBondealSchema.index({ salon: 1, exposantId: 1 })
exposantBondealSchema.index({ salon: 1, statut: 1 })
exposantBondealSchema.index({ salon: 1, createdAt: -1 })

const ExposantBondeal = mongoose.model('ExposantBondeal', exposantBondealSchema)

module.exports = ExposantBondeal

