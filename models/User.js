const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new mongoose.Schema({
    salon: {
        type: Schema.Types.ObjectId,
        ref: 'Salon',
        index: true
    },
    // userId est en fait le deviceId - identifiant unique du device
    userId: {
        type: String,
        required: true,
        index: true,
        unique: true // Un device ne peut être enregistré qu'une seule fois
    },
    notificationToken: {
        type: String,
        required: true,
        index: true
    },
    deviceInfo: {
        deviceId: String,
        platform: {
            type: String,
            enum: ['ios', 'android', 'web'],
            default: 'android'
        },
        version: String,
        model: String,
        brand: String
    },
    appVersion: {
        type: String,
        default: '1.0.0'
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    preferences: {
        enabled: {
            type: Boolean,
            default: true
        },
        categories: {
            general: {
                type: Boolean,
                default: true
            },
            promotions: {
                type: Boolean,
                default: true
            },
            updates: {
                type: Boolean,
                default: true
            },
            appUpdates: {
                type: Boolean,
                default: true,
                description: 'Notifications pour les nouvelles versions de l\'application'
            },
            salonChanges: {
                type: Boolean,
                default: true,
                description: 'Notifications pour les changements de salon actif'
            },
            events: {
                type: Boolean,
                default: true,
                description: 'Notifications pour les nouveaux événements'
            }
        }
    }
}, {
    collection: 'users',
    timestamps: true
})

// Index pour améliorer les performances
// Note: userId (deviceId) est unique (un device = un enregistrement)
userSchema.index({ salon: 1, isActive: 1 })
userSchema.index({ notificationToken: 1, isActive: 1 })
userSchema.index({ 'deviceInfo.platform': 1, isActive: 1 })
userSchema.index({ lastActive: 1 })

// Middleware pour mettre à jour lastActive
userSchema.pre('save', function (next) {
    if (this.isModified('notificationToken') || this.isModified('deviceInfo')) {
        this.lastActive = new Date()
    }
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User

