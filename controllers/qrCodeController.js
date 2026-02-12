const QRCode = require('../models/QRCode')
const Exposant = require('../models/Exposant')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

/**
 * Générer ou régénérer un QR code pour un exposant (admin seulement)
 */
const generateQRCode = async (req, res) => {
    try {
        const { exposantId } = req.params
        const { durationDays = 30 } = req.body

        // Validation de la durée (1 à 90 jours)
        if (durationDays < 1 || durationDays > 90) {
            return res.status(400).json({
                success: false,
                message: 'La durée doit être entre 1 et 90 jours'
            })
        }

        // Vérifier que l'exposant existe
        const exposant = await Exposant.findById(exposantId)
        if (!exposant) {
            return res.status(404).json({
                success: false,
                message: 'Exposant non trouvé'
            })
        }

        // Désactiver l'ancien QR code s'il existe
        await QRCode.updateOne(
            { exposantId, isActive: true },
            { isActive: false }
        )

        // Générer un nouveau token
        let token
        let isUnique = false
        while (!isUnique) {
            token = crypto.randomBytes(32).toString('hex')
            const existingQR = await QRCode.findOne({ token })
            if (!existingQR) {
                isUnique = true
            }
        }

        // Calculer la date d'expiration
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + durationDays)

        // Créer le nouveau QR code
        const qrCode = await QRCode.create({
            exposantId,
            token,
            durationDays,
            expiresAt,
            isActive: true,
            createdBy: req.admin?._id || null
        })

        res.json({
            success: true,
            message: 'QR code généré avec succès',
            data: qrCode
        })
    } catch (error) {
        console.error('Error generating QR code:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du QR code',
            error: error.message
        })
    }
}

/**
 * Récupérer le QR code d'un exposant (admin seulement)
 */
const getQRCodeByExposant = async (req, res) => {
    try {
        const { exposantId } = req.params

        const qrCode = await QRCode.findOne({
            exposantId,
            isActive: true
        }).populate('exposantId', 'nom email')

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'Aucun QR code actif trouvé pour cet exposant'
            })
        }

        res.json({
            success: true,
            data: qrCode
        })
    } catch (error) {
        console.error('Error getting QR code:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du QR code',
            error: error.message
        })
    }
}

/**
 * Scanner un QR code pour se connecter (app)
 */
const scanQRCode = async (req, res) => {
    try {
        const { token } = req.body

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token QR code requis'
            })
        }

        // Rechercher le QR code actif
        const qrCode = await QRCode.findOne({
            token,
            isActive: true
        }).populate('exposantId')

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'QR code invalide ou expiré'
            })
        }

        // Vérifier si le QR code est valide (pas expiré)
        if (!qrCode.isValid()) {
            return res.status(400).json({
                success: false,
                message: 'QR code expiré'
            })
        }

        // Vérifier que l'exposant existe et est actif
        if (!qrCode.exposantId || qrCode.exposantId.statut !== 1) {
            return res.status(400).json({
                success: false,
                message: 'Compte exposant invalide ou désactivé'
            })
        }

        // Générer un token JWT pour l'exposant
        const jwtToken = jwt.sign(
            {
                id: qrCode.exposantId._id,
                email: qrCode.exposantId.email,
                role: 'exposant'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        )

        // Retourner les données de l'exposant et le token
        const exposantData = qrCode.exposantId.toObject()
        delete exposantData.password

        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                token: jwtToken,
                exposant: exposantData
            }
        })
    } catch (error) {
        console.error('Error scanning QR code:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion via QR code',
            error: error.message
        })
    }
}

/**
 * Désactiver un QR code (admin seulement)
 */
const deactivateQRCode = async (req, res) => {
    try {
        const { exposantId } = req.params

        const qrCode = await QRCode.findOneAndUpdate(
            { exposantId, isActive: true },
            { isActive: false },
            { new: true }
        )

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'QR code non trouvé'
            })
        }

        res.json({
            success: true,
            message: 'QR code désactivé avec succès'
        })
    } catch (error) {
        console.error('Error deactivating QR code:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la désactivation du QR code',
            error: error.message
        })
    }
}

module.exports = {
    generateQRCode,
    getQRCodeByExposant,
    scanQRCode,
    deactivateQRCode
}

