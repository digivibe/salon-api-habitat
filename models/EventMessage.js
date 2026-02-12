const mongoose = require('mongoose')
const autopopulate = require('mongoose-autopopulate')
const Schema = mongoose.Schema

const eventMessageSchema = new mongoose.Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: false, // Rendu optionnel pour permettre les invités
        autopopulate: {
            select: 'nom profilePic email'
        }
    },
    inviteId: {
        type: Schema.Types.ObjectId,
        ref: 'Invite',
        required: false, // Optionnel pour permettre les exposants
        autopopulate: {
            select: 'nom email'
        }
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

eventMessageSchema.plugin(autopopulate)

// Index pour améliorer les performances
eventMessageSchema.index({ eventId: 1, createdAt: -1 })
eventMessageSchema.index({ eventId: 1, statut: 1 })
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

