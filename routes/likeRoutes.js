const express = require('express')
const router = express.Router()
const {
    toggleLike,
    getLikesByVideoId,
    getLikesByExposantId,
    checkLike,
    deleteLike,
    getLikeStats
} = require('../controllers/likeController')
const { requireAuth } = require('../middlewares/auth')
const { filterBySalon } = require('../middlewares/salon')

// Routes publiques (avec filtrage par salon)
router.get('/video/:videoId', filterBySalon, getLikesByVideoId)
router.get('/exposant/:exposantId', filterBySalon, getLikesByExposantId)
router.get('/stats/video/:videoId', filterBySalon, getLikeStats)

// Routes protégées (authentification requise)
router.post('/toggle', requireAuth, toggleLike)
router.get('/check', requireAuth, checkLike)
router.delete('/:id', requireAuth, deleteLike)

module.exports = router

