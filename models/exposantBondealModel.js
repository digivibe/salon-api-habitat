const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ExposantBondealSchema = new mongoose.Schema({
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: true
    },
    image: {
        type: String,
        required: true,
        unique: true,
        maxlength: 200
    },
    title: {
        type: String,
        required: true,
        unique: true,
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
}, { collection: 'exposantbondeals' })

module.exports = mongoose.model('ExposantBondeal', ExposantBondealSchema)