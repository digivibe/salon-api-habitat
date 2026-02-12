const jwt = require('jsonwebtoken')
const Exposant = require('../models/Exposant')
const Invite = require('../models/Invite')

/**
 * Middleware pour vérifier l'authentification JWT
 * Supporte aussi l'ancien système de token pour faciliter la migration
 */
const requireAuth = async (req, res, next) => {
    try {
        // Récupérer le token depuis header, body ou query
        let token = req.headers.authorization?.replace('Bearer ', '') || 
                   req.headers.authorization?.replace('bearer ', '') ||
                   req.body.token || 
                   req.query.token

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant'
            })
        }

        // Essayer de décoder le JWT
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.userId = decoded.id
            
            // Essayer d'abord de trouver un Exposant
            let exposant = await Exposant.findById(decoded.id)
            
            if (exposant) {
                req.exposantId = decoded.id
                req.exposant = exposant
                req.userType = 'exposant'
                
                console.log('🔐 [Auth] Exposant trouvé:', {
                    exposantId: req.exposantId,
                    hasExposant: !!req.exposant,
                    exposantStatut: req.exposant?.statut,
                    exposantSalon: req.exposant?.salon?.toString(),
                    isValid: req.exposant?.isValid
                })
                
                if (req.exposant.statut === 0) {
                    console.error('❌ [Auth] Exposant inactif:', req.exposantId)
                    return res.status(401).json({
                        success: false,
                        message: 'Compte désactivé'
                    })
                }

                // Vérifier que l'exposant appartient au salon si salonId est présent
                if (req.salonId && req.exposant.salon.toString() !== req.salonId.toString()) {
                    console.error('❌ [Auth] Salon différent:', {
                        exposantSalon: req.exposant.salon.toString(),
                        requestSalon: req.salonId.toString()
                    })
                    return res.status(403).json({
                        success: false,
                        message: 'Vous n\'avez pas accès à ce salon'
                    })
                }

                console.log('✅ [Auth] Authentification Exposant réussie:', {
                    exposantId: req.exposantId,
                    salon: req.exposant.salon?.toString(),
                    isValid: req.exposant.isValid
                })

                next()
            } else {
                // Si pas d'Exposant, essayer de trouver un Invité
                let invite = await Invite.findById(decoded.id)
                
                if (invite) {
                    req.inviteId = decoded.id
                    req.invite = invite
                    req.userType = 'invite'
                    
                    console.log('🔐 [Auth] Invité trouvé:', {
                        inviteId: req.inviteId,
                        hasInvite: !!req.invite,
                        inviteStatut: req.invite?.statut,
                        isActive: req.invite?.isActive
                    })
                    
                    if (invite.statut === 0 || !invite.isActive) {
                        console.error('❌ [Auth] Invité inactif:', req.inviteId)
                        return res.status(401).json({
                            success: false,
                            message: 'Compte désactivé'
                        })
                    }

                    console.log('✅ [Auth] Authentification Invité réussie:', {
                        inviteId: req.inviteId
                    })

                    next()
                } else {
                    console.error('❌ [Auth] Utilisateur non trouvé:', decoded.id)
                    return res.status(401).json({
                        success: false,
                        message: 'Utilisateur non trouvé'
                    })
                }
            }
        } catch (jwtError) {
            // Si ce n'est pas un JWT valide, essayer l'ancien système (pour migration)
            // TODO: Implémenter l'ancien système si nécessaire
            return res.status(401).json({
                success: false,
                message: 'Token invalide ou expiré',
                error: jwtError.message
            })
        }
    } catch (error) {
        console.error('Error in requireAuth middleware:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification de l\'authentification',
            error: error.message
        })
    }
}

/**
 * Middleware pour vérifier que l'utilisateur est administrateur
 * isValid = 3 signifie administrateur
 */
const requireAdmin = async (req, res, next) => {
    try {
        // D'abord vérifier l'authentification
        await requireAuth(req, res, () => {
            // Vérifier que l'utilisateur est administrateur
            if (req.exposant.isValid !== 3) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Droits d\'administrateur requis.'
                })
            }
            next()
        })
    } catch (error) {
        console.error('Error in requireAdmin middleware:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification des droits administrateur',
            error: error.message
        })
    }
}

/**
 * Middleware optionnel pour vérifier l'authentification (ne bloque pas si pas de token)
 * Utile pour les routes qui fonctionnent avec ou sans authentification
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.replace('Bearer ', '') || 
                   req.headers.authorization?.replace('bearer ', '') ||
                   req.body.token || 
                   req.query.token

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                req.exposantId = decoded.id
                req.exposant = await Exposant.findById(decoded.id)
            } catch (jwtError) {
                // Ignorer l'erreur si le token n'est pas valide
                req.exposantId = null
                req.exposant = null
            }
        }
        next()
    } catch (error) {
        // En cas d'erreur, continuer sans authentification
        req.exposantId = null
        req.exposant = null
        next()
    }
}

/**
 * Middleware pour vérifier que l'utilisateur est un exposant authentifié
 * Alias de requireAuth pour plus de clarté dans les routes
 */
const requireExposant = requireAuth

module.exports = {
    requireAuth,
    requireAdmin,
    requireExposant,
    optionalAuth
}

