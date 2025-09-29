const fallbackService = require("../services/fallbackService")

/**
 * Middleware pour vérifier l'existence des ressources avant les opérations
 * et rediriger vers les serveurs de fallback si nécessaire
 */
exports.checkResourceExists = (resourceType) => {
    return async (req, res, next) => {
        try {
            let resourceId
            let exists = false

            // Déterminer l'ID de la ressource selon le type
            switch (resourceType) {
                case "exposant":
                    resourceId = req.params.exposantId || req.body.exposantId
                    if (resourceId) {
                        exists = await fallbackService.checkExposantExists(resourceId)
                    }
                    break
                case "video":
                    resourceId = req.params.videoId || req.body.videoId
                    if (resourceId) {
                        exists = await fallbackService.checkVideoExists(resourceId)
                    }
                    break
                default:
                    return next()
            }

            // Si la ressource n'existe pas localement mais existe dans un serveur de fallback
            if (resourceId && !exists) {
                console.log(`[v0] Ressource ${resourceType} ${resourceId} non trouvée localement, mais disponible via fallback`)
                // Marquer la requête pour utiliser le fallback
                req.useFallback = true
                req.fallbackResourceType = resourceType
                req.fallbackResourceId = resourceId
            }

            next()
        } catch (error) {
            console.log(`[v0] Erreur lors de la vérification de ressource ${resourceType}:`, error.message)
            next()
        }
    }
}

/**
 * Middleware pour logger les tentatives de fallback
 */
exports.logFallbackAttempt = (req, res, next) => {
    if (req.useFallback) {
        console.log(`[v0] Utilisation du fallback pour ${req.method} ${req.originalUrl}`)
    }
    next()
}