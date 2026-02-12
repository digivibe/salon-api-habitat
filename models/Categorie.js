const mongoose = require('mongoose')
const Schema = mongoose.Schema

const categorieSchema = new mongoose.Schema({
    salon: {
        type: Schema.Types.ObjectId,
        ref: 'Salon',
        required: true,
        index: true
    },
    color: {
        type: String,
        required: true,
        maxlength: 7,
        match: /^#[0-9A-Fa-f]{6}$/ // Format hexadécimal
    },
    borderColor: {
        type: String,
        required: true,
        maxlength: 7,
        match: /^#[0-9A-Fa-f]{6}$/ // Format hexadécimal
    },
    label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    statut: {
        type: Number,
        enum: [0, 1], // 0 = inactif, 1 = actif
        default: 1
    }
}, {
    collection: 'categories',
    timestamps: true
})

// Index pour améliorer les performances
categorieSchema.index({ salon: 1, label: 1 }, { unique: true })
categorieSchema.index({ salon: 1, statut: 1 })

const Categorie = mongoose.model('Categorie', categorieSchema)

module.exports = Categorie

