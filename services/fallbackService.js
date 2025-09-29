const axios = require("axios")

class FallbackService {
    constructor() {
        // URLs des serveurs de fallback (à configurer via les variables d'environnement)
        this.fallbackServers = [
            process.env.FALLBACK_SERVER_1 || "http://localhost:3001",
            process.env.FALLBACK_SERVER_2 || "http://localhost:3002",
        ]

        // Timeout pour les requêtes de fallback
        this.timeout = 5000
    }

    /**
     * Effectue une requête vers les serveurs de fallback
     * @param {string} endpoint - L'endpoint à appeler
     * @param {string} method - La méthode HTTP (GET, POST, PUT, DELETE)
     * @param {object} data - Les données à envoyer (pour POST/PUT)
     * @param {object} params - Les paramètres de requête
     * @returns {Promise} - La réponse du premier serveur qui répond avec succès
     */
    async makeRequest(endpoint, method = "GET", data = null, params = {}) {
        const errors = []

        for (const serverUrl of this.fallbackServers) {
            try {
                console.log(`[v0] Tentative de fallback vers ${serverUrl}${endpoint}`)

                const config = {
                    method: method.toLowerCase(),
                    url: `${serverUrl}${endpoint}`,
                    timeout: this.timeout,
                    params: params,
                }

                if (data && (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT")) {
                    config.data = data
                }

                const response = await axios(config)

                if (response.status >= 200 && response.status < 300) {
                    console.log(`[v0] Fallback réussi vers ${serverUrl}`)
                    return response.data
                }
            } catch (error) {
                console.log(`[v0] Échec du fallback vers ${serverUrl}: ${error.message}`)
                errors.push({
                    server: serverUrl,
                    error: error.message,
                })
            }
        }

        // Si tous les serveurs de fallback échouent
        throw new Error(`Tous les serveurs de fallback ont échoué: ${JSON.stringify(errors)}`)
    }

    /**
     * Recherche des données d'exposant par ID dans les serveurs de fallback
     */
    async findExposantById(exposantId) {
        return this.makeRequest(`/api/exposants/${exposantId}`, "GET")
    }

    /**
     * Recherche des données de vidéo par ID dans les serveurs de fallback
     */
    async findVideoById(videoId) {
        return this.makeRequest(`/api/videos/${videoId}`, "GET")
    }

    /**
     * Recherche des likes par exposant ID dans les serveurs de fallback
     */
    async findLikesByExposantId(exposantId) {
        return this.makeRequest(`/api/likes/exposant/${exposantId}`, "GET")
    }

    /**
     * Recherche des likes par video ID dans les serveurs de fallback
     */
    async findLikesByVideoId(videoId) {
        return this.makeRequest(`/api/likes/video/${videoId}`, "GET")
    }

    /**
     * Recherche des commentaires par exposant ID dans les serveurs de fallback
     */
    async findCommentsByExposantId(exposantId) {
        return this.makeRequest(`/api/comments/exposant/${exposantId}`, "GET")
    }

    /**
     * Recherche des commentaires par video ID dans les serveurs de fallback
     */
    async findCommentsByVideoId(videoId) {
        return this.makeRequest(`/api/comments/video/${videoId}`, "GET")
    }

    /**
     * Crée un like dans les serveurs de fallback
     */
    async createLike(likeData) {
        return this.makeRequest("/api/likes", "POST", likeData)
    }

    /**
     * Toggle un like dans les serveurs de fallback
     */
    async toggleLike(toggleData) {
        return this.makeRequest("/api/likes/toggle", "POST", toggleData)
    }

    /**
     * Crée un commentaire dans les serveurs de fallback
     */
    async createComment(commentData) {
        return this.makeRequest("/api/comments", "POST", commentData)
    }

    /**
     * Vérifie si un exposant existe dans les serveurs de fallback
     */
    async checkExposantExists(exposantId) {
        try {
            await this.findExposantById(exposantId)
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * Vérifie si une vidéo existe dans les serveurs de fallback
     */
    async checkVideoExists(videoId) {
        try {
            await this.findVideoById(videoId)
            return true
        } catch (error) {
            return false
        }
    }
}

module.exports = new FallbackService()