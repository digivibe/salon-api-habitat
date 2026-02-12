const mongoose = require('mongoose')
const autopopulate = require('mongoose-autopopulate')
const Schema = mongoose.Schema

const commentSchema = new mongoose.Schema({
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
    collection: 'comments',
    timestamps: true
})

commentSchema.plugin(autopopulate)

// Index pour améliorer les performances
commentSchema.index({ salon: 1, videoId: 1, createdAt: -1 })
commentSchema.index({ salon: 1, exposantId: 1, createdAt: -1 })
commentSchema.index({ salon: 1, statut: 1 })

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment

