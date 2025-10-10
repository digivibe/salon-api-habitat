const { checkExposantLogin } = require('../libs/checkExposantLogin');
const Exposant = require('../models/exposantModel');

/**
 * Middleware pour vérifier que l'utilisateur est un administrateur
 * isValid = 3 signifie administrateur
 */
exports.requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token || req.query.token;

        if (!token) {
            return res.status(401).json({
                status: 401,
                message: "Token d'authentification manquant"
            });
        }

        // Vérifier le token et récupérer l'exposant ID
        const exposantId = await checkExposantLogin(token);

        if (!exposantId) {
            return res.status(401).json({
                status: 401,
                message: "Token invalide ou session expirée"
            });
        }

        // Récupérer l'exposant
        const exposant = await Exposant.findById(exposantId);

        if (!exposant) {
            return res.status(401).json({
                status: 401,
                message: "Utilisateur non trouvé"
            });
        }

        // Vérifier que l'utilisateur est administrateur (isValid = 3)
        if (exposant.isValid !== 3) {
            return res.status(403).json({
                status: 403,
                message: "Accès refusé. Droits d'administrateur requis."
            });
        }

        // Ajouter l'exposant à la requête pour utilisation ultérieure
        req.exposant = exposant;
        req.exposantId = exposantId;

        next();
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Erreur lors de la vérification de l'authentification",
            error: error.message
        });
    }
};

/**
 * Middleware optionnel pour vérifier l'authentification sans exiger admin
 */
exports.requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token || req.query.token;

        if (!token) {
            return res.status(401).json({
                status: 401,
                message: "Token d'authentification manquant"
            });
        }

        const exposantId = await checkExposantLogin(token);

        if (!exposantId) {
            return res.status(401).json({
                status: 401,
                message: "Token invalide ou session expirée"
            });
        }

        const exposant = await Exposant.findById(exposantId);

        if (!exposant) {
            return res.status(401).json({
                status: 401,
                message: "Utilisateur non trouvé"
            });
        }

        req.exposant = exposant;
        req.exposantId = exposantId;

        next();
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Erreur lors de la vérification de l'authentification",
            error: error.message
        });
    }
};
