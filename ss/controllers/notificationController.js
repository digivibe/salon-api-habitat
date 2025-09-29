const User = require('../models/User')
const { Expo } = require('expo-server-sdk')

// Créer une nouvelle instance du SDK Expo
const expo = new Expo()

// Enregistrer un utilisateur
const registerUser = async (req, res) => {
    try {
        const { userId, notificationToken, deviceInfo, registeredAt, appVersion } = req.body

        // Validation des données requises
        if (!userId || !notificationToken) {
            return res.status(400).json({
                success: false,
                message: 'userId et notificationToken sont requis'
            })
        }

        // Vérifier si le token est valide
        if (!Expo.isExpoPushToken(notificationToken)) {
            return res.status(400).json({
                success: false,
                message: 'Token de notification invalide'
            })
        }

        // Vérifier si l'utilisateur existe déjà
        let existingUser = await User.findOne({ userId })

        if (existingUser) {
            // Mettre à jour les informations si l'utilisateur existe
            existingUser.notificationToken = notificationToken
            existingUser.deviceInfo = deviceInfo
            existingUser.appVersion = appVersion
            existingUser.lastActive = new Date()
            existingUser.isActive = true

            await existingUser.save()

            return res.status(200).json({
                success: true,
                message: 'Utilisateur mis à jour avec succès',
                user: {
                    userId: existingUser.userId,
                    registeredAt: existingUser.registeredAt,
                    isActive: existingUser.isActive
                }
            })
        }

        // Créer un nouvel utilisateur
        const newUser = new User({
            userId,
            notificationToken,
            deviceInfo,
            registeredAt: registeredAt || new Date(),
            appVersion,
            isActive: true,
            lastActive: new Date()
        })

        await newUser.save()

        res.status(201).json({
            success: true,
            message: 'Utilisateur enregistré avec succès',
            user: {
                userId: newUser.userId,
                registeredAt: newUser.registeredAt,
                isActive: newUser.isActive
            }
        })

    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'enregistrement'
        })
    }
}

// Envoyer une notification à un utilisateur spécifique
const sendNotificationToUser = async (req, res) => {
    try {
        const { userId, title, body, data } = req.body

        if (!userId || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'userId, title et body sont requis'
            })
        }

        // Trouver l'utilisateur
        const user = await User.findOne({ userId, isActive: true })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé ou inactif'
            })
        }

        // Préparer le message
        const message = {
            to: user.notificationToken,
            sound: 'default',
            title,
            body,
            data: data || {}
        }

        // Envoyer la notification
        const ticket = await expo.sendPushNotificationsAsync([message])

        res.status(200).json({
            success: true,
            message: 'Notification envoyée avec succès',
            ticket: ticket[0]
        })

    } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'envoi de la notification'
        })
    }
}

// Envoyer une notification à tous les utilisateurs actifs
const sendNotificationToAll = async (req, res) => {
    try {
        const { title, body, data } = req.body

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: 'title et body sont requis'
            })
        }

        // Récupérer tous les utilisateurs actifs
        const users = await User.find({ isActive: true })

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun utilisateur actif trouvé'
            })
        }

        // Préparer les messages
        const messages = users.map(user => ({
            to: user.notificationToken,
            sound: 'default',
            title,
            body,
            data: data || {}
        }))

        // Filtrer les tokens valides
        const validMessages = messages.filter(message =>
            Expo.isExpoPushToken(message.to)
        )

        if (validMessages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun token valide trouvé'
            })
        }

        // Envoyer les notifications par chunks
        const chunks = expo.chunkPushNotifications(validMessages)
        const tickets = []

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
                tickets.push(...ticketChunk)
            } catch (error) {
                console.error('Erreur lors de l\'envoi d\'un chunk:', error)
            }
        }

        res.status(200).json({
            success: true,
            message: `Notifications envoyées à ${validMessages.length} utilisateurs`,
            totalSent: validMessages.length,
            tickets: tickets
        })

    } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'envoi des notifications'
        })
    }
}

// Désactiver un utilisateur
const deactivateUser = async (req, res) => {
    try {
        const { userId } = req.params

        const user = await User.findOneAndUpdate(
            { userId },
            { isActive: false },
            { new: true }
        )

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Utilisateur désactivé avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la désactivation:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la désactivation'
        })
    }
}

// Obtenir les statistiques des utilisateurs
const getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments()
        const activeUsers = await User.countDocuments({ isActive: true })
        const inactiveUsers = totalUsers - activeUsers

        // Statistiques par plateforme
        const platformStats = await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$deviceInfo.platform', count: { $sum: 1 } } }
        ])

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                inactiveUsers,
                platformStats
            }
        })

    } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des statistiques'
        })
    }
}

module.exports = {
    registerUser,
    sendNotificationToUser,
    sendNotificationToAll,
    deactivateUser,
    getUserStats
}