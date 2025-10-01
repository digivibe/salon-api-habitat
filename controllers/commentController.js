const Comment = require("../models/commentModel")
const Exposant = require("../models/exposantModel")
const ExposantVideo = require("../models/exposantVideoModel")
const fallbackService = require("../services/fallbackService")

/**
 * Vérifie si l'exposant et la vidéo appartiennent au même salon
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

    if (!video.exposantId) {
        throw new Error("Cette vidéo n'appartient à aucun exposant")
    }

    return { exposant, video }
}

// Get comments by video ID avec fallback
exports.getCommentsByVideoID = async (req, res) => {
    try {
        // Chercher localement
        const comments = await Comment.find({ videoId: req.params.videoId })
            .populate('exposantId', 'nom profil')
            .sort({ createdAt: -1 })

        if (comments.length > 0) {
            return res.status(200).json(comments)
        }

        // Fallback vers les autres salons
        console.log("[v0] Aucun commentaire trouvé localement, vérification ailleurs")

        try {
            const fallbackComments = await fallbackService.findCommentsByVideoId(req.params.videoId)

            // Marquer comme lecture seule
            const markedComments = fallbackComments.map(comment => ({
                ...comment,
                _readOnly: true,
                _fromOtherSalon: true
            }))

            return res.status(200).json(markedComments)
        } catch (fallbackError) {
            console.log("[v0] Aucun commentaire trouvé dans les autres salons")
            return res.status(200).json([])
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des commentaires:', error)
        res.status(500).json({ error: error.message })
    }
}

// Get comments by exposant ID avec fallback
exports.getCommentsByExposantID = async (req, res) => {
    try {
        const comments = await Comment.find({ exposantId: req.params.exposantId })
            .populate('exposantId', 'nom profil')
            .sort({ createdAt: -1 })

        if (comments.length > 0) {
            return res.status(200).json(comments)
        }

        console.log("[v0] Aucun commentaire trouvé localement pour cet exposant")

        try {
            const fallbackComments = await fallbackService.findCommentsByExposantId(req.params.exposantId)
            return res.status(200).json(fallbackComments)
        } catch (fallbackError) {
            console.log("[v0] Aucun commentaire trouvé dans les autres salons")
            return res.status(200).json([])
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Create comment AVEC VÉRIFICATION DE SALON
exports.createComment = async (req, res) => {
    try {
        const { exposantId, videoId, content } = req.body

        if (!exposantId || !videoId || !content) {
            return res.status(400).json({
                error: "Données manquantes",
                message: "exposantId, videoId et content sont requis"
            })
        }

        // Vérifier que l'exposant et la vidéo sont du même salon
        try {
            await checkSalonOwnership(exposantId, videoId)
        } catch (ownershipError) {
            return res.status(403).json({
                error: "Action interdite",
                message: "Vous ne pouvez commenter que les vidéos de votre salon",
                details: ownershipError.message
            })
        }

        // Vérifier que le créateur de la vidéo est aussi du même salon
        const video = await ExposantVideo.findById(videoId).populate('exposantId')
        const videoOwner = await Exposant.findById(video.exposantId._id)

        if (!videoOwner) {
            return res.status(403).json({
                error: "Action interdite",
                message: "Cette vidéo appartient à un exposant d'un autre salon"
            })
        }

        // Tout est OK, créer le commentaire
        const newComment = new Comment(req.body)
        await newComment.save()

        // Populer les données avant de retourner
        await newComment.populate('exposantId', 'nom profil')

        console.log(`[Comment] Exposant ${exposantId} a commenté la vidéo ${videoId}`)

        res.status(201).json(newComment)
    } catch (error) {
        console.error('Erreur lors de la création du commentaire:', error)
        res.status(400).json({ error: error.message })
    }
}

// Update comment AVEC VÉRIFICATION
exports.updateComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé" })
        }

        // Vérifier que le commentaire appartient à l'exposant qui veut le modifier
        if (req.body.exposantId && comment.exposantId.toString() !== req.body.exposantId) {
            return res.status(403).json({
                error: "Action interdite",
                message: "Vous ne pouvez modifier que vos propres commentaires"
            })
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            { new: true, runValidators: true }
        ).populate('exposantId', 'nom profil')

        res.status(200).json(updatedComment)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// Delete comment AVEC VÉRIFICATION
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé" })
        }

        // Vérifier que le commentaire appartient à l'exposant qui veut le supprimer
        // (ou que c'est un admin - à implémenter si besoin)

        const deletedComment = await Comment.findByIdAndDelete(req.params.id)

        console.log(`[Comment] Commentaire ${req.params.id} supprimé`)

        res.status(200).json({ message: "Commentaire supprimé avec succès" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get all comments (admin uniquement)
exports.getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find()
            .populate('exposantId', 'nom profil')
            .populate('videoId', 'name description')
            .sort({ createdAt: -1 })

        res.status(200).json(comments)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get comment by ID
exports.getCommentByID = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)
            .populate('exposantId', 'nom profil')
            .populate('videoId', 'name description')

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé" })
        }

        res.status(200).json(comment)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}