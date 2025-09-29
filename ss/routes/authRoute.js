const express = require('express')

const authController = require('../controllers/authController')

const router = express.Router()

// router.post('/global', authController.addMultipleExposants)
router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/forgot-password', authController.forgotPassword)
router.post('/check-password', authController.checkPassword)

module.exports = router