// services/notificationService.js
const User = require('../models/User')
const { Expo } = require('expo-server-sdk')
const expo = new Expo()

const notifyAllUsers = async (title, body, data) => {
    const users = await User.find({ isActive: true })

    const messages = users
        .filter(user => Expo.isExpoPushToken(user.notificationToken))
        .map(user => ({
            to: user.notificationToken,
            sound: 'default',
            title,
            body,
            data
        }))

    const chunks = expo.chunkPushNotifications(messages)
    const tickets = []

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
            tickets.push(...ticketChunk)
        } catch (err) {
            console.error('Erreur envoi chunk:', err)
        }
    }

    return tickets
}

module.exports = { notifyAllUsers }
