const express = require('express')

const eventController = require('../controllers/eventController')

const router = express.Router()

router.post('/add', eventController.create)
router.delete('/delete/:id', eventController.delete)

module.exports = router