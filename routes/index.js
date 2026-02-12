const express = require('express')
const router = express.Router()

// Import des routes
const salonRoutes = require('./salonRoutes')
const appRoutes = require('./appRoutes')
const authRoutes = require('./authRoutes')
const exposantRoutes = require('./exposantRoutes')
const likeRoutes = require('./likeRoutes')
const commentRoutes = require('./commentRoutes')
const notificationRoutes = require('./notificationRoutes')
const adminRoutes = require('./adminRoutes')
const docsRoutes = require('./docsRoutes')
const qrCodeRoutes = require('./qrCodeRoutes')

// Routes API v2
router.use('/salons', salonRoutes)
router.use('/app', appRoutes)
router.use('/auth', authRoutes)
router.use('/exposants', exposantRoutes)
router.use('/likes', likeRoutes)
router.use('/comments', commentRoutes)
router.use('/notifications', notificationRoutes)
router.use('/admin', adminRoutes)
router.use('/docs', docsRoutes)
router.use('/qrcode', qrCodeRoutes)

// Route de test
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API v2 is working!',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    })
})

module.exports = router

