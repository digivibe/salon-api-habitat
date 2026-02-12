const mongoose = require('mongoose')
const crypto = require('crypto')
const Schema = mongoose.Schema

const qrCodeSchema = new mongoose.Schema({
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    durationDays: {
        type: Number,
        required: true,
        min: 1,
        max: 90, // Maximum 3 mois (90 jours)
        default: 30
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: false // Peut être null si généré par système
    }
}, {
    collection: 'qrcodes',
    timestamps: true
})

// Index pour les requêtes courantes
// Index composite unique : un seul QR code actif par exposant
qrCodeSchema.index({ exposantId: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } })
qrCodeSchema.index({ token: 1, isActive: 1 })
qrCodeSchema.index({ expiresAt: 1 })

// Méthode statique pour générer un token unique
qrCodeSchema.statics.generateToken = function() {
    return crypto.randomBytes(32).toString('hex')
}

// Méthode pour vérifier si le QR code est valide
qrCodeSchema.methods.isValid = function() {
    return this.isActive && new Date() < this.expiresAt
}

// Middleware pre-save pour calculer la date d'expiration
qrCodeSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('durationDays') || this.isModified('createdAt')) {
        const expirationDate = new Date(this.createdAt || Date.now())
        expirationDate.setDate(expirationDate.getDate() + this.durationDays)
        this.expiresAt = expirationDate
    }
    next()
})

const QRCode = mongoose.model('QRCode', qrCodeSchema)

module.exports = QRCode

