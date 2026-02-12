const express = require('express')
const router = express.Router()
const {
    register,
    login,
    registerInvite,
    loginInvite,
    forgotPassword,
    checkPassword,
    getMe
} = require('../controllers/authController')
const { requireAuth } = require('../middlewares/auth')

// Routes publiques pour Exposants
router.post('/register', register)
router.post('/login', login)

// Routes publiques pour Invités (avec compte)
router.post('/invites/register', registerInvite)
router.post('/invites/login', loginInvite)

// Route publique
router.post('/forgot-password', forgotPassword)

// Routes protégées (authentification requise)
router.get('/me', requireAuth, getMe)
router.post('/check-password', requireAuth, checkPassword)

module.exports = router

