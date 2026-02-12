const express = require('express')
const router = express.Router()
const {
    getAllExposants,
    getExposantById,
    postNewVideo,
    deleteVideo,
    getVideos,
    postNewBondeal,
    deleteBondeal,
    getBondeals,
    updateProfilePic,
    updateCoverPic,
    updateInfos,
    updatePassword,
    deleteAccount
} = require('../controllers/exposantController')
const { requireAuth, optionalAuth } = require('../middlewares/auth')
const { filterBySalon } = require('../middlewares/salon')
const { upload, uploadToCloudinary } = require('../middlewares/upload')

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
    if (err) {
        console.error('❌ [Multer Error]', {
            message: err.message,
            code: err.code,
            field: err.field,
            storageErrors: err.storageErrors
        })
        
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Fichier trop volumineux. Taille maximum: 100MB'
            })
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: `Champ de fichier inattendu: ${err.field}. Vérifiez le nom du champ dans le formulaire.`
            })
        }
        
        return res.status(400).json({
            success: false,
            message: err.message || 'Erreur lors de l\'upload du fichier'
        })
    }
    next()
}

// Routes publiques
router.get('/', filterBySalon, getAllExposants)
// Routes spécifiques AVANT la route générique /:id
// Utiliser optionalAuth pour filtrer automatiquement par exposant si authentifié
router.get('/videos', optionalAuth, getVideos)
router.get('/bondeals', optionalAuth, getBondeals)
router.get('/:id', getExposantById)

// Routes protégées (authentification requise)
// Note: handleMulterError doit être appelé après upload.single() pour capturer les erreurs multer
router.post('/videos', requireAuth, upload.single('video'), handleMulterError, uploadToCloudinary, postNewVideo)
router.delete('/videos/:id', requireAuth, deleteVideo)

router.post('/bondeals', requireAuth, upload.single('image'), handleMulterError, uploadToCloudinary, postNewBondeal)
router.delete('/bondeals/:id', requireAuth, deleteBondeal)

router.post('/profile-pic', requireAuth, upload.single('profilePic'), handleMulterError, uploadToCloudinary, updateProfilePic)
router.post('/cover-pic', requireAuth, upload.single('coverPic'), handleMulterError, uploadToCloudinary, updateCoverPic)

router.put('/infos', requireAuth, updateInfos)
router.put('/password', requireAuth, updatePassword)
router.delete('/account', requireAuth, deleteAccount)

module.exports = router

