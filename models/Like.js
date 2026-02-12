const mongoose = require('mongoose')
const autopopulate = require('mongoose-autopopulate')
const Schema = mongoose.Schema

const likeSchema = new mongoose.Schema({
    salon: {
        type: Schema.Types.ObjectId,
        ref: 'Salon',
        required: true,
        index: true
    },
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: true,
        autopopulate: {
            select: 'nom profil email'
        }
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'ExposantVideo',
        required: true,
        autopopulate: {
            select: 'name description videoUrl'
        }
    },
    statut: {
        type: Number,
        enum: [0, 1], // 0 = inactif, 1 = actif
        default: 1
    }
}, {
    collection: 'likes',
    timestamps: true
})

likeSchema.plugin(autopopulate)

// Index pour améliorer les performances et éviter les doublons
likeSchema.index({ salon: 1, exposantId: 1, videoId: 1 }, { unique: true })
likeSchema.index({ salon: 1, videoId: 1 })
likeSchema.index({ salon: 1, exposantId: 1 })

const Like = mongoose.model('Like', likeSchema)

module.exports = Like

