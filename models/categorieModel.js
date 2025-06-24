const mongoose = require('mongoose')

const categorieSchema = new mongoose.Schema({
    color: {
        type: String,
        required: true,
        maxlength: 7
    },
    borderColor: {
        type: String,
        required: true,
        maxlength: 7
    },
    label: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    statut: {
        type: Number,
        enum: [0, 1],
        default: 1
    }
}, { collection: 'categories' })

module.exports = mongoose.model('Categorie', categorieSchema)