const express = require('express')
const router = express.Router()
const {
    createComment,
    getCommentsByVideoId,
    getCommentsByExposantId,
    updateComment,
    deleteComment,
    getCommentStats
} = require('../controllers/commentController')
const { requireAuth } = require('../middlewares/auth')
const { filterBySalon } = require('../middlewares/salon')

// Routes publiques (avec filtrage par salon)
router.get('/video/:videoId', filterBySalon, getCommentsByVideoId)
router.get('/exposant/:exposantId', filterBySalon, getCommentsByExposantId)
router.get('/stats/video/:videoId', filterBySalon, getCommentStats)

// Routes protégées (authentification requise)
router.post('/', requireAuth, createComment)
router.put('/:id', requireAuth, updateComment)
router.delete('/:id', requireAuth, deleteComment)

module.exports = router

