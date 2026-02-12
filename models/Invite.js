const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

const inviteSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 256,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 256
    },
    isActive: {
        type: Boolean,
        default: true
    },
    statut: {
        type: Number,
        required: true,
        enum: [0, 1], // 0 = inactif, 1 = actif
        default: 1
    }
}, {
    collection: 'invites',
    timestamps: true
})

// Hash du mot de passe avant sauvegarde
inviteSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()

    try {
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (error) {
        next(error)
    }
})

// Index pour améliorer les performances
inviteSchema.index({ email: 1 }, { unique: true })
inviteSchema.index({ statut: 1 })
inviteSchema.index({ isActive: 1 })

// Méthode pour comparer les mots de passe
inviteSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

const Invite = mongoose.model('Invite', inviteSchema)

module.exports = Invite









