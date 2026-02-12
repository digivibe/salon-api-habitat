const express = require('express')
const router = express.Router()
const {
    registerUser,
    sendNotificationToUser,
    sendNotificationToAll,
    deactivateUser,
    getUserStats,
    getPreferences,
    updatePreferences
} = require('../controllers/notificationController')
const { requireAdmin } = require('../middlewares/auth')

// Route publique
router.post('/register', registerUser)

// Routes pour les préférences (publiques, basées sur userId)
router.get('/preferences/:userId', getPreferences)
router.put('/preferences/:userId', updatePreferences)

// Routes protégées (admin uniquement)
router.post('/send-to-user', requireAdmin, sendNotificationToUser)
router.post('/send-to-all', requireAdmin, sendNotificationToAll)
router.put('/deactivate/:userId', requireAdmin, deactivateUser)
router.get('/stats', requireAdmin, getUserStats)

module.exports = router

