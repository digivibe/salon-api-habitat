const Salon = require('../models/Salon')

/**
 * Middleware pour filtrer les requêtes par salon
 * Récupère le salon depuis query, body ou params et vérifie qu'il existe et est actif
 */
const filterBySalon = async (req, res, next) => {
    try {
        // Récupérer le salon depuis query, body ou params
        const salonId = req.query.salon || req.body.salon || req.params.salonId

        if (!salonId) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID is required. Provide it in query (?salon=id), body or params (:salonId)'
            })
        }

        // Vérifier que le salon existe
        const salon = await Salon.findById(salonId)

        if (!salon) {
            return res.status(404).json({
                success: false,
                message: 'Salon not found'
            })
        }

        // Vérifier que le salon est actif (optionnel selon les besoins)
        if (salon.statut === 0) {
            return res.status(403).json({
                success: false,
                message: 'Salon is inactive'
            })
        }

        // Ajouter le salon à la requête pour utilisation dans les controllers
        req.salon = salon
        req.salonId = salonId

        next()
    } catch (error) {
        console.error('Error in filterBySalon middleware:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while filtering by salon',
            error: error.message
        })
    }
}

/**
 * Middleware optionnel pour vérifier si le salon est actif (isActive = true)
 * Utilisé pour les routes qui nécessitent un salon actif
 */
const requireActiveSalon = async (req, res, next) => {
    try {
        if (!req.salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon not found in request. Use filterBySalon middleware first.'
            })
        }

        if (!req.salon.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Salon is not active'
            })
        }

        next()
    } catch (error) {
        console.error('Error in requireActiveSalon middleware:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while checking active salon',
            error: error.message
        })
    }
}

module.exports = {
    filterBySalon,
    requireActiveSalon
}

