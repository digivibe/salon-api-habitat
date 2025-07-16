const express = require('express')
const { getActiveSalon, setActiveSalon } = require('../controllers/salonController')

const router = express.Router()

router.get('/active', getActiveSalon)
router.post('/active', setActiveSalon)

module.exports = router