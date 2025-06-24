const express = require('express')

const exposantController = require('../controllers/exposantController')
const { upload, uploadToCloudinary } = require("../middlewares/uploadMiddleware");

const { uploadExposantVideo } = require('../middlewares/uploadExposantVideo')
const { uploadExposantBondeal } = require('../middlewares/uploadExposantBondeal')
const { uploadProfilePic } = require('../middlewares/uploadProfilePic')
const { uploadCoverPic } = require('../middlewares/uploadCoverPic')

const router = express.Router()

router.post('/post-video', upload.single('video'), uploadToCloudinary, exposantController.postNewVideo)
router.post('/delete-video', exposantController.dropVideos)
router.get('/videos', exposantController.getVideos)
router.post('/post-bondeal', upload.single('bondealPic'), uploadToCloudinary, exposantController.postNewBondeal)
router.post('/delete-bondeal', exposantController.dropBondeal)
router.get('/bondeals', exposantController.getBondeals)
router.post('/update-profile-pic', upload.single('profilePic'), uploadToCloudinary, exposantController.changeProfilePic)
router.post('/update-cover-pic', upload.single('coverPic'), uploadToCloudinary, exposantController.changeCoverPic)
router.post('/update-infos', exposantController.updateData)
router.post('/update-password', exposantController.updatePassword)
router.put('/update-id/:id', exposantController.updateById)
router.delete('/delete-account', exposantController.deleteAccount)

module.exports = router