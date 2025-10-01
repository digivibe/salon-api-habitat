const Like = require("../models/likeModel")
const Exposant = require("../models/exposantModel")
const ExposantVideo = require("../models/exposantVideoModel")
const fallbackService = require("../services/fallbackService")

/**
 * Vérifie si l'exposant et la vidéo appartiennent au même salon (serveur)
 */
const checkSalonOwnership = async (exposantId, videoId) => {
    const exposant = await Exposant.findById(exposantId)
    const video = await ExposantVideo.findById(videoId).populate('exposantId')

    if (!exposant) {
        throw new Error("Exposant non trouvé dans ce salon")
    }

    if (!video) {
        throw new Error("Vidéo non trouvée dans ce salon")
    }

    // Si la vidéo n'a pas d'exposantId, c'est une vidéo orpheline
    if (!video.exposantId) {
        throw new Error("Cette vidéo n'appartient à aucun exposant")
    }

    return { exposant, video }
}

// Get likes by video ID avec fallback intelligent
exports.getLikesByVideoID = async (req, res) => {
    try {
        // D'abord chercher localement
        const likes = await Like.find({ videoId: req.params.videoId })
            .populate('exposantId', 'nom profil')

        if (likes.length > 0) {
            return res.status(200).json(likes)
        }

        // Si vide localement, vérifier si la vidéo existe dans un autre salon
        console.log("[v0] Aucun like trouvé localement, vérification dans les autres salons")

        try {
            const fallbackLikes = await fallbackService.findLikesByVideoId(req.params.videoId)

            // Marquer les likes comme venant d'un autre salon (lecture seule)
            const markedLikes = fallbackLikes.map(like => ({
                ...like,
                _readOnly: true,
                _fromOtherSalon: true
            }))

            return res.status(200).json(markedLikes)
        } catch (fallbackError) {
            console.log("[v0] Aucun like trouvé dans les autres salons")
            // Retourner un tableau vide si rien trouvé nulle part
            return res.status(200).json([])
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des likes:', error)
        res.status(500).json({ error: error.message })
    }
}

// Get likes by exposant ID avec fallback
exports.getLikesByExposantID = async (req, res) => {
    try {
        const likes = await Like.find({ exposantId: req.params.exposantId })
            .populate('exposantId', 'nom profil')

        if (likes.length > 0) {
            return res.status(200).json(likes)
        }

        console.log("[v0] Aucun like trouvé localement pour cet exposant")

        try {
            const fallbackLikes = await fallbackService.findLikesByExposantId(req.params.exposantId)
            return res.status(200).json(fallbackLikes)
        } catch (fallbackError) {
            console.log("[v0] Aucun like trouvé dans les autres salons")
            return res.status(200).json([])
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Toggle like AVEC VÉRIFICATION DE SALON
exports.toggleLike = async (req, res) => {
    const { exposantId, videoId } = req.body

    try {
        // ÉTAPE 1 : Vérifier que l'exposant et la vidéo sont du même salon
        let exposant, video

        try {
            const ownership = await checkSalonOwnership(exposantId, videoId)
            exposant = ownership.exposant
            video = ownership.video
        } catch (ownershipError) {
            return res.status(403).json({
                error: "Action interdite",
                message: "Vous ne pouvez interagir qu'avec les vidéos de votre salon",
                details: ownershipError.message
            })
        }

        // ÉTAPE 2 : Vérifier que l'exposant et le créateur de la vidéo sont du même salon
        const videoOwner = await Exposant.findById(video.exposantId._id)

        if (!videoOwner) {
            return res.status(403).json({
                error: "Action interdite",
                message: "Cette vidéo appartient à un exposant d'un autre salon"
            })
        }

        // ÉTAPE 3 : Toggle le like (tout est OK)
        const existingLike = await Like.findOne({ exposantId, videoId })

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id)
            console.log(`[Like] Exposant ${exposantId} a unliké la vidéo ${videoId}`)
        } else {
            const newLike = new Like({ exposantId, videoId })
            await newLike.save()
            console.log(`[Like] Exposant ${exposantId} a liké la vidéo ${videoId}`)
        }

        // Retourner tous les likes de la vidéo
        const likes = await Like.find({ videoId })
            .populate('exposantId', 'nom profil')

        res.status(200).json(likes)

    } catch (error) {
        console.error('Erreur lors du toggle like:', error)
        res.status(500).json({ error: error.message })
    }
}

// Create like AVEC VÉRIFICATION
exports.createLike = async (req, res) => {
    try {
        const { exposantId, videoId } = req.body

        // Vérifier que c'est dans le même salon
        try {
            await checkSalonOwnership(exposantId, videoId)
        } catch (ownershipError) {
            return res.status(403).json({
                error: "Action interdite",
                message: "Vous ne pouvez liker que les vidéos de votre salon"
            })
        }

        const newLike = new Like(req.body)
        await newLike.save()

        res.status(201).json(newLike)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// Get all likes (admin uniquement)
exports.getAllLikes = async (req, res) => {
    try {
        const likes = await Like.find()
            .populate('exposantId', 'nom profil')
            .populate('videoId', 'name description')
        res.status(200).json(likes)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get like by ID
exports.getLikeByID = async (req, res) => {
    try {
        const like = await Like.findById(req.params.id)
            .populate('exposantId', 'nom profil')
            .populate('videoId', 'name description')

        if (!like) {
            return res.status(404).json({ message: "Like not found" })
        }

        res.status(200).json(like)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Delete a like
exports.deleteLike = async (req, res) => {
    try {
        const deletedLike = await Like.findByIdAndDelete(req.params.id)

        if (!deletedLike) {
            return res.status(404).json({ message: "Like not found" })
        }

        res.status(200).json({ message: "Like deleted successfully" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}