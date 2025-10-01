// services/fallbackService.js - SERVICE COMPLET
const axios = require("axios")
const Exposant = require('../models/exposantModel')
const ExposantVideo = require('../models/exposantVideoModel')

class FallbackService {
    constructor() {
        // URLs des 3 serveurs de salon
        this.servers = {
            salonA: process.env.SALON_A_URL || "https://salon-emploi-api.onrender.com",
            salonB: process.env.SALON_B_URL || "https://salon-habitat-api.onrender.com",
            salonC: process.env.SALON_C_URL || "https://marche-noel-api.onrender.com",
        }

        // Salon actuel (celui sur lequel tourne cette instance)
        this.currentSalon = process.env.CURRENT_SALON || "salonA"

        // Timeout pour les requêtes
        this.timeout = 5000
    }

    /**
     * Retourne la liste des serveurs de fallback (tous sauf le serveur actuel)
     */
    getFallbackServers() {
        return Object.entries(this.servers)
            .filter(([salonKey]) => salonKey !== this.currentSalon)
            .map(([_, url]) => url)
    }

    /**
     * Effectue une requête vers les serveurs de fallback
     */
    async makeRequest(endpoint, method = "GET", data = null, params = {}) {
        const fallbackServers = this.getFallbackServers()
        const errors = []

        for (const serverUrl of fallbackServers) {
            try {
                console.log(`[Fallback] Tentative vers ${serverUrl}${endpoint}`)

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
                    console.log(`[Fallback] ✓ Succès depuis ${serverUrl}`)
                    return response.data
                }
            } catch (error) {
                console.log(`[Fallback] ✗ Échec depuis ${serverUrl}: ${error.message}`)
                errors.push({
                    server: serverUrl,
                    error: error.message,
                })
            }
        }

        throw new Error(`Tous les serveurs de fallback ont échoué: ${JSON.stringify(errors)}`)
    }

    /**
     * Vérifie si un exposant existe localement
     */
    async checkExposantExistsLocally(exposantId) {
        try {
            const exposant = await Exposant.findById(exposantId)
            return !!exposant
        } catch (error) {
            return false
        }
    }

    /**
     * Vérifie si une vidéo existe localement
     */
    async checkVideoExistsLocally(videoId) {
        try {
            const video = await ExposantVideo.findById(videoId)
            return !!video
        } catch (error) {
            return false
        }
    }

    /**
     * Vérifie si un exposant existe (local + fallback)
     */
    async checkExposantExists(exposantId) {
        // D'abord vérifier localement
        const existsLocally = await this.checkExposantExistsLocally(exposantId)
        if (existsLocally) return true

        // Sinon chercher dans les autres serveurs
        try {
            await this.makeRequest(`/api/v1/app/all-exposants`, "GET")
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * Vérifie si une vidéo existe (local + fallback)
     */
    async checkVideoExists(videoId) {
        const existsLocally = await this.checkVideoExistsLocally(videoId)
        if (existsLocally) return true

        try {
            await this.makeRequest(`/api/v1/app/all-posts`, "GET")
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * Récupère les likes d'une vidéo avec fallback
     */
    async findLikesByVideoId(videoId) {
        return this.makeRequest(`/api/v1/likes/video/${videoId}`, "GET")
    }

    /**
     * Récupère les commentaires d'une vidéo avec fallback
     */
    async findCommentsByVideoId(videoId) {
        return this.makeRequest(`/api/v1/comments/video/${videoId}`, "GET")
    }

    /**
     * Récupère les likes d'un exposant avec fallback
     */
    async findLikesByExposantId(exposantId) {
        return this.makeRequest(`/api/v1/likes/exposant/${exposantId}`, "GET")
    }

    /**
     * Récupère les commentaires d'un exposant avec fallback
     */
    async findCommentsByExposantId(exposantId) {
        return this.makeRequest(`/api/v1/comments/exposant/${exposantId}`, "GET")
    }

    /**
     * IMPORTANT : Ne PAS créer de like/commentaire cross-salon
     * On retourne une erreur explicite
     */
    async createLike(likeData) {
        throw new Error("Vous ne pouvez pas liker une vidéo d'un autre salon")
    }

    async createComment(commentData) {
        throw new Error("Vous ne pouvez pas commenter une vidéo d'un autre salon")
    }

    async toggleLike(toggleData) {
        throw new Error("Vous ne pouvez pas liker/unliker une vidéo d'un autre salon")
    }

    /**
     * Récupère les données d'un exposant depuis un autre salon
     */
    async findExposantById(exposantId) {
        return this.makeRequest(`/api/v1/app/all-exposants`, "GET")
            .then(exposants => exposants.find(e => e._id === exposantId))
    }

    /**
     * Récupère les données d'une vidéo depuis un autre salon
     */
    async findVideoById(videoId) {
        return this.makeRequest(`/api/v1/app/all-posts`, "GET")
            .then(videos => videos.find(v => v._id === videoId))
    }
}

module.exports = new FallbackService()