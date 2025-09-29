const express = require('express')

const testController = require('../controllers/testController')

const router = express.Router()

router.get('/all-expo', testController.allExpo)
router.get('/delete-fake-expo', testController.deleteFakeExpo)
router.post('/update-expo', testController.updateExposantsWithUsernames)

module.exports = router