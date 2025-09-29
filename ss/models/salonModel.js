const mongoose = require('mongoose')

const salonSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true })

const Salon = mongoose.model('Salon', salonSchema);

module.exports = Salon