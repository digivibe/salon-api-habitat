const User = require('../models/User')
const { Expo } = require('expo-server-sdk')

// Créer une nouvelle instance du SDK Expo
const expo = new Expo()

/**
 * Envoyer une notification à tous les devices actifs
 * @param {String} title - Titre de la notification
 * @param {String} body - Corps de la notification
 * @param {Object} data - Données supplémentaires
 * @param {String} salonId - ID du salon (optionnel, pour filtrer par salon actuel du device)
 * @param {String} category - Catégorie de notification (general, promotions, updates, appUpdates, salonChanges, events)
 * Note: Les notifications sont liées aux devices, pas aux utilisateurs
 */
const notifyAllUsers = async (title, body, data = {}, salonId = null, category = 'general') => {
    try {
        // Construire la requête
        const query = { isActive: true, 'preferences.enabled': true }
        if (salonId) {
            query.salon = salonId // Filtrer par salon actuel du device
        }

        // Récupérer tous les devices actifs
        const users = await User.find(query)

        if (users.length === 0) {
            console.log('Aucun device actif trouvé')
            return []
        }

        // Filtrer les devices selon la catégorie de notification
        const filteredUsers = users.filter(user => {
            // Vérifier si le token est valide
            if (!Expo.isExpoPushToken(user.notificationToken)) {
                return false
            }

            // Vérifier si le device a activé cette catégorie de notification
            if (user.preferences && user.preferences.categories) {
                // Si la catégorie n'existe pas dans les préférences, autoriser par défaut (rétrocompatibilité)
                if (user.preferences.categories[category] !== undefined) {
                    return user.preferences.categories[category] === true
                }
            }
            // Par défaut, autoriser si les préférences ne sont pas définies
            return true
        })

        if (filteredUsers.length === 0) {
            console.log(`Aucun device avec la catégorie ${category} activée`)
            return []
        }

        // Préparer les messages
        const messages = filteredUsers.map(user => ({
            to: user.notificationToken,
            sound: 'default',
            title,
            body,
            data: {
                ...data,
                category,
                salonId: salonId || user.salon?.toString()
            }
        }))

        if (messages.length === 0) {
            console.log('Aucun token valide trouvé')
            return []
        }

        // Envoyer les notifications par chunks
        const chunks = expo.chunkPushNotifications(messages)
        const tickets = []

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
                tickets.push(...ticketChunk)
            } catch (error) {
                console.error('Erreur lors de l\'envoi d\'un chunk:', error)
            }
        }

        return tickets
    } catch (error) {
        console.error('Erreur dans notifyAllUsers:', error)
        throw error
    }
}

/**
 * Envoyer une notification à un device spécifique
 * @param {String} userId - ID du device (deviceId)
 * @param {String} title - Titre de la notification
 * @param {String} body - Corps de la notification
 * @param {Object} data - Données supplémentaires
 * @param {String} category - Catégorie de notification (general, promotions, updates, appUpdates, salonChanges, events)
 */
const notifyUser = async (userId, title, body, data = {}, category = 'general') => {
    try {
        const user = await User.findOne({ userId, isActive: true, 'preferences.enabled': true })

        if (!user) {
            throw new Error('Device non trouvé ou notifications désactivées')
        }

        if (!Expo.isExpoPushToken(user.notificationToken)) {
            throw new Error('Token de notification invalide')
        }

        // Vérifier si le device a activé cette catégorie de notification
        if (user.preferences && user.preferences.categories) {
            if (user.preferences.categories[category] !== undefined && user.preferences.categories[category] === false) {
                throw new Error(`Le device a désactivé les notifications de type ${category}`)
            }
        }

        const message = {
            to: user.notificationToken,
            sound: 'default',
            title,
            body,
            data: {
                ...data,
                category,
                salonId: user.salon?.toString()
            }
        }

        const tickets = await expo.sendPushNotificationsAsync([message])
        return tickets[0]
    } catch (error) {
        console.error('Erreur dans notifyUser:', error)
        throw error
    }
}

module.exports = {
    notifyAllUsers,
    notifyUser
}

