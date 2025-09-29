// routes/notificationRoutes.js
const express = require('express')
const router = express.Router()
const {
    registerUser,
    sendNotificationToUser,
    sendNotificationToAll,
    deactivateUser,
    getUserStats
} = require('../controllers/notificationController')

// Enregistrer un utilisateur
router.post('/register-user', registerUser)

// Envoyer une notification à un utilisateur spécifique
router.post('/send-to-user', sendNotificationToUser)

// Envoyer une notification à tous les utilisateurs
router.post('/send-to-all', sendNotificationToAll)

// Désactiver un utilisateur
router.put('/deactivate/:userId', deactivateUser)

// Obtenir les statistiques des utilisateurs
router.get('/stats', getUserStats)

module.exports = router