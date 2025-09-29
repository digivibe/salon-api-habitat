const mongoose = require('mongoose')
const Schema = mongoose.Schema

const loginSchema = new mongoose.Schema({
    visitorId: {
        type: Schema.Types.ObjectId,
        ref: 'Visitor',
        required: true
    },
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: true
    },
    session: {
        type: Number,
        required: true,
        enum: [0, 1]
    }
}, { collection: 'logins', timestamps: true })

module.exports = mongoose.model('Login', loginSchema)