const mongoose = require('mongoose')

const featureSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
    },
    label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    enabled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'features'
})

featureSchema.index({ key: 1 })

const Feature = mongoose.model('Feature', featureSchema)

module.exports = Feature
