const express = require('express')
const router = express.Router()
const {
    getVersion,
    getAllCategories,
    createCategory,
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getAllPosts,
    makeRDV,
    getMyRdv,
    updateRdv,
    deleteRdv
} = require('../controllers/appController')
const {
    createEventMessage,
    getEventMessages,
    updateEventMessage,
    deleteEventMessage
} = require('../controllers/eventMessageController')
const { requireAdmin, requireExposant } = require('../middlewares/auth')
const { filterBySalon } = require('../middlewares/salon')

// Route publique
router.get('/version', getVersion)

// Routes avec filtrage par salon
router.get('/categories', filterBySalon, getAllCategories)
router.get('/all-posts', filterBySalon, getAllPosts)
// Routes événements (indépendants des salons)
router.get('/events', getAllEvents)
router.get('/events/:id', getEventById)

// Routes protégées (admin uniquement)
router.post('/categories', requireAdmin, createCategory)
router.post('/events', requireAdmin, createEvent)
router.put('/events/:id', requireAdmin, updateEvent)
router.delete('/events/:id', requireAdmin, deleteEvent)

// Route publique pour les rendez-vous
router.post('/make-rdv', makeRDV)

// Routes protégées pour la gestion des RDV (exposant uniquement)
router.get('/my-rdv', requireExposant, getMyRdv)
router.patch('/rdv/:id', requireExposant, updateRdv)
router.delete('/rdv/:id', requireExposant, deleteRdv)

// Routes pour les messages d'événements
// Route publique pour lire les messages
router.get('/event-messages/:eventId', getEventMessages)
// Routes protégées pour créer, modifier et supprimer les messages (exposant uniquement)
router.post('/event-messages', requireExposant, createEventMessage)
router.put('/event-messages/:id', requireExposant, updateEventMessage)
router.delete('/event-messages/:id', requireExposant, deleteEventMessage)

module.exports = router

