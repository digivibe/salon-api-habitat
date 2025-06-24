const mongoose = require('mongoose')
const Schema = mongoose.Schema

const exposantVideoSchema = new mongoose.Schema({
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: true
    },
    name: {
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
}, { collection: 'exposantvideos' })

module.exports = mongoose.model('ExposantVideo', exposantVideoSchema)