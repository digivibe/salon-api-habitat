const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

const exposantSchema = new mongoose.Schema({
    salon: {
        type: Schema.Types.ObjectId,
        ref: 'Salon',
        required: true,
        index: true
    },
    categorie: {
        type: Schema.Types.ObjectId,
        ref: 'Categorie',
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        maxlength: 256
    },
    username: {
        type: String,
        required: true,
        trim: true,
        maxlength: 256
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 256
    },
    nom: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    profil: {
        type: String,
        required: true,
        default: process.env.DEFAULT_PROFILE_PIC || 'https://dormans-api.onrender.com/assets/img/profile.png'
    },
    cover: {
        type: String,
        required: true,
        default: process.env.DEFAULT_COVER_PIC || 'https://dormans-api.onrender.com/assets/img/cover.png'
    },
    location: {
        type: String,
        required: true,
        trim: true,
        maxlength: 256
    },
    bio: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    isValid: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 3],
        // 0 = simple exposant
        // 1 = exposant validé sans publication
        // 2 = exposant validé avec publication
        // 3 = administrateur
        default: 2
    },
    phoneNumber: {
        type: String,
        trim: true,
        maxlength: 20,
        default: ''
    },
    linkedinLink: {
        type: String,
        trim: true,
        maxlength: 256,
        default: ''
    },
    facebookLink: {
        type: String,
        trim: true,
        maxlength: 256,
        default: ''
    },
    instaLink: {
        type: String,
        trim: true,
        maxlength: 256,
        default: ''
    },
    weblink: {
        type: String,
        trim: true,
        maxlength: 256,
        default: ''
    },
    statut: {
        type: Number,
        required: true,
        enum: [0, 1], // 0 = inactif, 1 = actif
        default: 1
    }
}, {
    collection: 'exposants',
    timestamps: true
})

// Hash du mot de passe avant sauvegarde
exposantSchema.pre('save', async function (next) {
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
exposantSchema.index({ salon: 1, email: 1 }, { unique: true })
exposantSchema.index({ salon: 1, username: 1 }, { unique: true })
exposantSchema.index({ salon: 1, statut: 1 })
exposantSchema.index({ salon: 1, isValid: 1 })
exposantSchema.index({ salon: 1, categorie: 1 })

// Méthode pour comparer les mots de passe
exposantSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

const Exposant = mongoose.model('Exposant', exposantSchema)

module.exports = Exposant

