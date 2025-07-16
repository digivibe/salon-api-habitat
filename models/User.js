// models/User.js
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
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
            required: true
        },
        version: String,
        model: String,
        brand: String
    },
    appVersion: {
        type: String,
        required: true
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
    // Historique des notifications envoyées
    notificationHistory: [{
        title: String,
        body: String,
        sentAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['sent', 'failed', 'delivered'],
            default: 'sent'
        }
    }],
    // Préférences de notification
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
            }
        }
    },
    // Métadonnées
    metadata: {
        totalNotificationsReceived: {
            type: Number,
            default: 0
        },
        lastNotificationAt: Date,
        registrationSource: {
            type: String,
            default: 'app'
        }
    }
}, {
    timestamps: true
})

// Index composé pour les requêtes fréquentes
userSchema.index({ userId: 1, isActive: 1 })
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

// Méthode pour ajouter une notification à l'historique
userSchema.methods.addNotificationToHistory = function (title, body, status = 'sent') {
    this.notificationHistory.push({
        title,
        body,
        status,
        sentAt: new Date()
    })

    // Garder seulement les 50 dernières notifications
    if (this.notificationHistory.length > 50) {
        this.notificationHistory = this.notificationHistory.slice(-50)
    }

    // Mettre à jour les métadonnées
    this.metadata.totalNotificationsReceived += 1
    this.metadata.lastNotificationAt = new Date()

    return this.save()
}

// Méthode pour vérifier si l'utilisateur peut recevoir des notifications
userSchema.methods.canReceiveNotifications = function () {
    return this.isActive && this.preferences.enabled
}

// Méthode pour désactiver l'utilisateur
userSchema.methods.deactivate = function () {
    this.isActive = false
    return this.save()
}

// Méthode pour réactiver l'utilisateur
userSchema.methods.reactivate = function () {
    this.isActive = true
    this.lastActive = new Date()
    return this.save()
}

// Méthode statique pour nettoyer les utilisateurs inactifs
userSchema.statics.cleanupInactiveUsers = function (daysInactive = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

    return this.updateMany(
        {
            lastActive: { $lt: cutoffDate },
            isActive: true
        },
        {
            isActive: false
        }
    )
}

// Méthode statique pour obtenir les statistiques
userSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        {
            $facet: {
                total: [{ $count: "count" }],
                active: [{ $match: { isActive: true } }, { $count: "count" }],
                byPlatform: [
                    { $match: { isActive: true } },
                    { $group: { _id: "$deviceInfo.platform", count: { $sum: 1 } } }
                ],
                byAppVersion: [
                    { $match: { isActive: true } },
                    { $group: { _id: "$appVersion", count: { $sum: 1 } } }
                ]
            }
        }
    ])

    return {
        totalUsers: stats[0].total[0]?.count || 0,
        activeUsers: stats[0].active[0]?.count || 0,
        platformStats: stats[0].byPlatform,
        appVersionStats: stats[0].byAppVersion
    }
}

module.exports = mongoose.model('User', userSchema)