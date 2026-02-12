const User = require('../models/User')
const { Expo } = require('expo-server-sdk')
const { notifyAllUsers, notifyUser } = require('../services/notificationService')

// Créer une nouvelle instance du SDK Expo
const expo = new Expo()

/**
 * Enregistrer un device pour les notifications push
 * POST /api/v2/notifications/register
 * Note: Les notifications sont liées au device, pas à un utilisateur
 */
const registerUser = async (req, res) => {
    try {
        const { userId, notificationToken, deviceInfo, appVersion, salon } = req.body

        // Validation des données requises
        if (!userId || !notificationToken) {
            return res.status(400).json({
                success: false,
                message: 'deviceId (userId) et notificationToken sont requis'
            })
        }

        // Vérifier si le token est valide
        if (!Expo.isExpoPushToken(notificationToken)) {
            return res.status(400).json({
                success: false,
                message: 'Token de notification invalide'
            })
        }

        // Vérifier si le device existe déjà (recherche uniquement par userId/deviceId)
        // Les notifications sont liées au device, pas au salon
        const query = { userId }

        let existingUser = await User.findOne(query)

        if (existingUser) {
            // Mettre à jour les informations si le device existe déjà
            existingUser.notificationToken = notificationToken
            existingUser.deviceInfo = deviceInfo || existingUser.deviceInfo
            existingUser.appVersion = appVersion || existingUser.appVersion
            existingUser.lastActive = new Date()
            existingUser.isActive = true
            // Mettre à jour le salon actuel (mais les préférences restent globales au device)
            if (salon) {
                existingUser.salon = salon
            }

            await existingUser.save()

            return res.status(200).json({
                success: true,
                message: 'Device mis à jour avec succès',
                data: {
                    deviceId: existingUser.userId,
                    registeredAt: existingUser.registeredAt,
                    isActive: existingUser.isActive
                }
            })
        }

        // Créer un nouvel enregistrement pour ce device
        const newUser = await User.create({
            salon: salon || null, // Salon actuel (peut changer, mais device reste le même)
            userId, // deviceId unique
            notificationToken,
            deviceInfo: deviceInfo || { platform: 'android' },
            appVersion: appVersion || '1.0.0',
            registeredAt: new Date(),
            lastActive: new Date(),
            isActive: true
        })

        res.status(201).json({
            success: true,
            message: 'Device enregistré avec succès',
            data: {
                deviceId: newUser.userId,
                registeredAt: newUser.registeredAt,
                isActive: newUser.isActive
            }
        })
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'enregistrement',
            error: error.message
        })
    }
}

/**
 * Envoyer une notification à un device spécifique
 * POST /api/v2/notifications/send-to-user
 * Requiert authentification admin
 * Note: userId est en fait le deviceId
 */
const sendNotificationToUser = async (req, res) => {
    try {
        const { userId, title, body, data, category } = req.body

        if (!userId || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'deviceId (userId), title et body sont requis'
            })
        }

        const ticket = await notifyUser(userId, title, body, data || {}, category || 'general')

        res.status(200).json({
            success: true,
            message: 'Notification envoyée avec succès',
            data: ticket
        })
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'envoi de la notification',
            error: error.message
        })
    }
}

/**
 * Envoyer une notification à tous les utilisateurs actifs
 * POST /api/v2/notifications/send-to-all
 * Requiert authentification admin
 */
const sendNotificationToAll = async (req, res) => {
    try {
        const { title, body, data, salon, category } = req.body

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: 'title et body sont requis'
            })
        }

        const tickets = await notifyAllUsers(title, body, data || {}, salon || null, category || 'general')

        res.status(200).json({
            success: true,
            message: `Notifications envoyées à ${tickets.length} utilisateurs`,
            data: {
                totalSent: tickets.length,
                tickets: tickets
            }
        })
    } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'envoi des notifications',
            error: error.message
        })
    }
}

/**
 * Désactiver un device
 * PUT /api/v2/notifications/deactivate/:deviceId
 * Requiert authentification admin
 * Note: userId est en fait le deviceId
 */
const deactivateUser = async (req, res) => {
    try {
        const { userId } = req.params // userId est en fait le deviceId

        const user = await User.findOneAndUpdate(
            { userId },
            { isActive: false },
            { new: true }
        )

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Device non trouvé'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Device désactivé avec succès'
        })
    } catch (error) {
        console.error('Erreur lors de la désactivation:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la désactivation',
            error: error.message
        })
    }
}

/**
 * Obtenir les statistiques des devices
 * GET /api/v2/notifications/stats?salon=:salonId
 * Requiert authentification admin
 * Note: Les stats sont basées sur les devices, pas les utilisateurs
 */
const getUserStats = async (req, res) => {
    try {
        const { salon } = req.query

        const query = {}
        if (salon) {
            query.salon = salon
        }

        const totalDevices = await User.countDocuments(query)
        const activeDevices = await User.countDocuments({ ...query, isActive: true })
        const inactiveDevices = totalDevices - activeDevices

        // Statistiques par plateforme
        const platformStats = await User.aggregate([
            { $match: { ...query, isActive: true } },
            { $group: { _id: '$deviceInfo.platform', count: { $sum: 1 } } }
        ])

        res.status(200).json({
            success: true,
            data: {
                totalDevices,
                activeDevices,
                inactiveDevices,
                platformStats
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des statistiques',
            error: error.message
        })
    }
}

/**
 * Obtenir les préférences de notifications d'un device
 * GET /api/v2/notifications/preferences/:deviceId
 * Note: Les préférences sont liées au device, pas au salon
 * Si le device n'existe pas, retourne des préférences par défaut
 */
const getPreferences = async (req, res) => {
    try {
        const { userId } = req.params // userId est en fait le deviceId

        // Recherche uniquement par deviceId (les préférences sont globales au device)
        const query = { userId }

        const user = await User.findOne(query).select('preferences')

        // Préférences par défaut
        const defaultPreferences = {
            enabled: true,
            categories: {
                general: true,
                updates: true,
                appUpdates: true,
                salonChanges: true,
                events: true
            }
        }

        // Si le device n'existe pas, retourner les préférences par défaut
        // (le device sera créé lors de l'enregistrement)
        if (!user) {
            return res.status(200).json({
                success: true,
                data: {
                    preferences: defaultPreferences,
                    isNewDevice: true // Indiquer que le device n'existe pas encore
                }
            })
        }

        res.status(200).json({
            success: true,
            data: {
                preferences: user.preferences || defaultPreferences
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des préférences:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des préférences',
            error: error.message
        })
    }
}

/**
 * Mettre à jour les préférences de notifications d'un device
 * PUT /api/v2/notifications/preferences/:deviceId
 * Note: Les préférences sont liées au device, pas au salon
 * Si le device n'existe pas, crée un enregistrement avec les préférences
 */
const updatePreferences = async (req, res) => {
    try {
        const { userId } = req.params // userId est en fait le deviceId
        const { preferences, notificationToken, deviceInfo, appVersion, salon } = req.body

        if (!preferences) {
            return res.status(400).json({
                success: false,
                message: 'Les préférences sont requises'
            })
        }

        // Recherche uniquement par deviceId (les préférences sont globales au device)
        const query = { userId }

        let user = await User.findOne(query)

        // Si le device n'existe pas, le créer avec les préférences
        if (!user) {
            // Vérifier que nous avons les informations minimales pour créer le device
            if (!notificationToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Le device doit être enregistré avant de mettre à jour les préférences. Token de notification requis.'
                })
            }

            // Vérifier si le token est valide
            if (!Expo.isExpoPushToken(notificationToken)) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de notification invalide'
                })
            }

            // Créer un nouvel enregistrement pour ce device
            user = await User.create({
                salon: salon || null,
                userId,
                notificationToken,
                deviceInfo: deviceInfo || { platform: 'android' },
                appVersion: appVersion || '1.0.0',
                registeredAt: new Date(),
                lastActive: new Date(),
                isActive: true,
                preferences: preferences
            })

            return res.status(201).json({
                success: true,
                message: 'Device créé et préférences sauvegardées avec succès',
                data: {
                    preferences: user.preferences
                }
            })
        }

        // Mettre à jour les préférences
        if (preferences.enabled !== undefined) {
            user.preferences.enabled = preferences.enabled
        }

        if (preferences.categories) {
            if (preferences.categories.general !== undefined) {
                user.preferences.categories.general = preferences.categories.general
            }
            if (preferences.categories.updates !== undefined) {
                user.preferences.categories.updates = preferences.categories.updates
            }
            if (preferences.categories.appUpdates !== undefined) {
                user.preferences.categories.appUpdates = preferences.categories.appUpdates
            }
            if (preferences.categories.salonChanges !== undefined) {
                user.preferences.categories.salonChanges = preferences.categories.salonChanges
            }
            if (preferences.categories.events !== undefined) {
                user.preferences.categories.events = preferences.categories.events
            }
        }

        await user.save()

        res.status(200).json({
            success: true,
            message: 'Préférences mises à jour avec succès',
            data: {
                preferences: user.preferences
            }
        })
    } catch (error) {
        console.error('Erreur lors de la mise à jour des préférences:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour des préférences',
            error: error.message
        })
    }
}

module.exports = {
    registerUser,
    sendNotificationToUser,
    sendNotificationToAll,
    deactivateUser,
    getUserStats,
    getPreferences,
    updatePreferences
}

