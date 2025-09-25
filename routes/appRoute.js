const express = require('express')

const appController = require('../controllers/appController')

const router = express.Router()

router.get('/version', appController.version)
app.get('/key/:key', appController.getAppValue)
router.post('/add-categorie', appController.createNewCategorie)
router.get('/all-categories', appController.getAllCategories)
router.post('/add-event', appController.createNewEvent)
router.get('/all-events', appController.getAllEvents)
router.get('/all-exposants', appController.getAllExposants)
router.get('/all-posts', appController.getAllPosts)
router.get('/exposant-posts', appController.getExposantsPosts)
router.get('/exposant-bondeals', appController.getExposantsBondeals)
router.post('/make-rdv', appController.makeRDV)

module.exports = router