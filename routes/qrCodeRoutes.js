const express = require('express')
const router = express.Router()
const {
    generateQRCode,
    getQRCodeByExposant,
    scanQRCode,
    deactivateQRCode
} = require('../controllers/qrCodeController')
const { requireAdmin } = require('../middlewares/auth')

// Route publique pour scanner un QR code (app)
router.post('/scan', scanQRCode)

// Routes admin (nécessitent l'authentification admin)
router.post('/generate/:exposantId', requireAdmin, generateQRCode)
router.get('/exposant/:exposantId', requireAdmin, getQRCodeByExposant)
router.post('/deactivate/:exposantId', requireAdmin, deactivateQRCode)

module.exports = router




















