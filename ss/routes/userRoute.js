const express = require('express')

const userController = require('../controllers/userController')

const router = express.Router()

router.get('/new', userController.createNewVisitor)
router.get('/check-login', userController.checkLogin)

module.exports = router