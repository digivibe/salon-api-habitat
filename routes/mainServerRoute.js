const express = require('express')
const router = express.Router()
const { getAllSalons, getActiveSalon, setActiveSalon } = require('../controllers/salonController')

router.get('/', getAllSalons)
router.get('/active', getActiveSalon)
router.post('/active', setActiveSalon)

module.exports = router