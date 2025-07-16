const express = require('express')
const router = express.Router()

const appRoute = require('./appRoute')
const authRoute = require('./authRoute')
const exposantRoute = require('./exposantRoute')
const eventRoute = require('./eventRoute')
const userRoute = require('./userRoute')
const mainServerRoute = require('./mainServerRoute')
const likeRoute = require('./likeRoute')
const commentRoute = require('./commentRoute')
const testRoute = require('./testRoute')
const notificationController = require('../controllers/appController')

router.use('/app', appRoute)
router.use('/auth', authRoute)
router.use('/exposant', exposantRoute)
router.use('/event', eventRoute)
router.use('/user', userRoute)
router.use('/main-server', mainServerRoute)
router.post('/registerNotificationToken', notificationController.registerNotificationToken)
// router.use('/test', testRoute) // SEULEMENT POUR LES TESTs
router.use('/', likeRoute)
router.use('/', commentRoute)

module.exports = router