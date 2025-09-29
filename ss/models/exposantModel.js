const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

const exposantSchema = new mongoose.Schema({
    categorie: {
        type: Schema.Types.ObjectId,
        ref: 'Categorie',
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 256
    },
    username: {
        type: String,
        required: true,
        unique: true,
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
        maxlength: 100,
        default: 'https://salon-api-habitat.onrender.com/uploads/exposants_profile_pic/logo.png'
    },
    cover: {
        type: String,
        required: true,
        maxlength: 100,
        default: 'https://salonapp-api-y25d.onrender.com/uploads/exposants_cover_pic/default.png'
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
        maxlength: 256
    },
    isValid: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 3],
        // 0 simple exposant 
        // 1 exposant validé no publication
        // 2 exposant validé with publication
        // 3 administrator
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
        maxlength: 256
    },
    facebookLink: {
        type: String,
        trim: true,
        maxlength: 256,
        default:''
    },
    instaLink: {
        type: String,
        trim: true,
        maxlength: 256,
        default:''
    },
    weblink: {
        type: String,
        trim: true,
        maxlength: 256,
        default:''
    },
    statut: {
        type: Number,
        required: true,
        enum: [0, 1],
        default: 1
    }
}, { collection: 'exposants', timestamps: true })

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

module.exports = mongoose.model('Exposant', exposantSchema)