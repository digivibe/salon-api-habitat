const mongoose = require('mongoose')
const Schema = mongoose.Schema

const eventMessageSchema = new mongoose.Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: false // Rendu optionnel pour permettre les invités
    },
    inviteId: {
        type: Schema.Types.ObjectId,
        ref: 'Invite',
        required: false // Optionnel pour permettre les exposants
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    statut: {
        type: Number,
        enum: [0, 1], // 0 = inactif, 1 = actif
        default: 1
    }
}, {
    collection: 'eventmessages',
    timestamps: true
})

// Index principal : couvre la lecture du fil (filtre eventId + statut, tri
// createdAt décroissant) ainsi que le polling delta (createdAt > since) et la
// pagination par curseur (createdAt < before). Un seul index composé suffit,
// Mongo peut l'utiliser en préfixe pour les requêtes sur eventId seul.
eventMessageSchema.index({ eventId: 1, statut: 1, createdAt: -1 })
// Utilisés pour retrouver les messages d'un auteur (modération, suppression
// de compte).
eventMessageSchema.index({ exposantId: 1 })
eventMessageSchema.index({ inviteId: 1 })

// Validation : au moins un des deux (exposantId ou inviteId) doit être présent
eventMessageSchema.pre('validate', function(next) {
    if (!this.exposantId && !this.inviteId) {
        this.invalidate('exposantId', 'Au moins exposantId ou inviteId doit être fourni')
        this.invalidate('inviteId', 'Au moins exposantId ou inviteId doit être fourni')
    }
    next()
})

const EventMessage = mongoose.model('EventMessage', eventMessageSchema)

module.exports = EventMessage
