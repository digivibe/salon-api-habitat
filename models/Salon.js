const mongoose = require('mongoose')

const salonSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    isActive: {
        type: Boolean,
        default: false
    },
    statut: {
        type: Number,
        enum: [0, 1], // 0 = inactif, 1 = actif
        default: 1
    }
}, {
    timestamps: true,
    collection: 'salons'
})

// Générer le slug automatiquement avant la sauvegarde
salonSchema.pre('save', function(next) {
    if (this.isModified('nom') || this.isNew) {
        this.slug = this.nom
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
            .replace(/[^a-z0-9]+/g, '-') // Remplacer les espaces et caractères spéciaux par des tirets
            .replace(/^-+|-+$/g, '') // Supprimer les tirets en début et fin
    }
    next()
})

// Index pour améliorer les performances
salonSchema.index({ slug: 1 })
salonSchema.index({ isActive: 1 })
salonSchema.index({ statut: 1 })

const Salon = mongoose.model('Salon', salonSchema)

module.exports = Salon

