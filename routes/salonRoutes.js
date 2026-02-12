const express = require('express')
const router = express.Router()
const {
    getAllSalons,
    getSalonById,
    getActiveSalon,
    setActiveSalon,
    createSalon,
    updateSalon,
    deleteSalon
} = require('../controllers/salonController')
const { requireAdmin } = require('../middlewares/auth')

// Routes publiques
router.get('/', getAllSalons)
router.get('/active', getActiveSalon)
router.get('/:id', getSalonById)

// Routes protégées (admin uniquement)
router.post('/', requireAdmin, createSalon)
router.post('/set-active', requireAdmin, setActiveSalon)
router.put('/:id', requireAdmin, updateSalon)
router.delete('/:id', requireAdmin, deleteSalon)

module.exports = router

