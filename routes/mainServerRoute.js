const express = require('express')
const router = express.Router()
const { getAllSalons, getActiveSalon, setActiveSalon, notifyNewAppVersion } = require('../controllers/salonController')

router.get('/', getAllSalons)
router.get('/active', getActiveSalon)
router.post('/active', setActiveSalon)
router.get('/new-v', notifyNewAppVersion)

module.exports = router