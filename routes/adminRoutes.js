const express = require('express')
const router = express.Router()
const {
    getStatistics,
    getAllExposants,
    getExposantById,
    createExposant,
    updateExposant,
    deleteExposant,
    updateExposantPermissions,
    updateExposantStatus,
    getExposantVideos,
    deleteVideoAdmin,
    updateVideoStatus,
    getExposantBondeals,
    deleteBondealAdmin
} = require('../controllers/adminController')
const {
    getAllInvites,
    getInviteById,
    createInvite,
    updateInvite,
    deleteInvite,
    updateInviteStatus
} = require('../controllers/inviteController')
const { requireAdmin } = require('../middlewares/auth')

// Toutes les routes admin nécessitent l'authentification admin
router.use(requireAdmin)

// Statistiques
router.get('/stats', getStatistics)

// Exposants CRUD
router.get('/exposants', getAllExposants)
router.get('/exposants/:id', getExposantById)
router.post('/exposants', createExposant)
router.put('/exposants/:id', updateExposant)
router.delete('/exposants/:id', deleteExposant)

// Gestion des permissions et statut
router.patch('/exposants/:id/permissions', updateExposantPermissions)
router.patch('/exposants/:id/status', updateExposantStatus)

// Gestion du contenu des exposants
router.get('/exposants/:id/videos', getExposantVideos)
router.get('/exposants/:id/bondeals', getExposantBondeals)

// Gestion des vidéos (admin)
router.delete('/videos/:id', deleteVideoAdmin)
router.patch('/videos/:id/status', updateVideoStatus)

// Gestion des bondeals (admin)
router.delete('/bondeals/:id', deleteBondealAdmin)

// Invités CRUD
router.get('/invites', getAllInvites)
router.get('/invites/:id', getInviteById)
router.post('/invites', createInvite)
router.put('/invites/:id', updateInvite)
router.delete('/invites/:id', deleteInvite)
router.patch('/invites/:id/status', updateInviteStatus)

module.exports = router

