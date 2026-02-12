const Comment = require('../models/Comment')
const Exposant = require('../models/Exposant')
const ExposantVideo = require('../models/ExposantVideo')

/**
 * Créer un commentaire
 * POST /api/v2/comments
 * Requiert authentification
 */
const createComment = async (req, res) => {
    try {
        const { videoId, content } = req.body

        if (!videoId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Video ID et contenu requis'
            })
        }

        if (content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du commentaire ne peut pas être vide'
            })
        }

        if (content.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du commentaire ne doit pas dépasser 1000 caractères'
            })
        }

        // Vérifier que la vidéo existe et appartient au même salon
        const video = await ExposantVideo.findById(videoId)

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Vidéo non trouvée'
            })
        }

        // Vérifier que la vidéo appartient au même salon que l'exposant
        const videoSalon = video.salon?.toString()
        const exposantSalon = req.exposant.salon?.toString()

        console.log('🔍 [CommentController] Vérification salon:', {
            videoId: videoId,
            videoSalon: videoSalon,
            exposantId: req.exposantId,
            exposantSalon: exposantSalon,
            videoExists: !!video,
            videoSalonType: typeof videoSalon,
            exposantSalonType: typeof exposantSalon
        })

        if (!videoSalon) {
            console.error('❌ [CommentController] Vidéo sans salon:', videoId)
            return res.status(400).json({
                success: false,
                message: 'La vidéo n\'appartient à aucun salon'
            })
        }

        if (!exposantSalon) {
            console.error('❌ [CommentController] Exposant sans salon:', req.exposantId)
            return res.status(400).json({
                success: false,
                message: 'Vous n\'appartenez à aucun salon'
            })
        }

        if (videoSalon !== exposantSalon) {
            console.error('❌ [CommentController] Salons différents:', {
                videoSalon,
                exposantSalon,
                match: false
            })
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez commenter que les vidéos de votre salon'
            })
        }

        console.log('✅ [CommentController] Salons correspondent:', {
            videoSalon,
            exposantSalon,
            match: true
        })

        // Créer le commentaire
        const newComment = await Comment.create({
            salon: req.exposant.salon,
            exposantId: req.exposantId,
            videoId: videoId,
            content: content.trim(),
            statut: 1
        })

        console.log('✅ [CommentController] Commentaire créé:', {
            id: newComment._id,
            videoId: newComment.videoId,
            exposantId: newComment.exposantId,
            salon: newComment.salon,
            statut: newComment.statut
        })

        // Populate pour retourner les informations complètes
        await newComment.populate('exposantId', 'nom profil email')
        await newComment.populate('videoId', 'name description videoUrl')

        console.log('✅ [CommentController] Commentaire peuplé:', {
            id: newComment._id,
            exposantNom: newComment.exposantId?.nom,
            content: newComment.content
        })

        res.status(201).json({
            success: true,
            message: 'Commentaire créé avec succès',
            data: newComment
        })
    } catch (error) {
        console.error('Error creating comment:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du commentaire',
            error: error.message
        })
    }
}

/**
 * Récupérer les commentaires d'une vidéo
 * GET /api/v2/comments/video/:videoId?salon=:salonId
 */
const getCommentsByVideoId = async (req, res) => {
    try {
        const { videoId } = req.params
        const { salon } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        const comments = await Comment.find({ salon, videoId, statut: 1 })
            .populate('exposantId', 'nom profil email')
            .sort({ createdAt: -1 })

        console.log('📊 [CommentController] Commentaires récupérés:', {
            videoId,
            salon,
            count: comments.length,
            commentIds: comments.map(c => c._id),
            comments: comments.map(c => ({
                id: c._id,
                content: c.content?.substring(0, 50),
                exposantId: c.exposantId?._id,
                statut: c.statut
            }))
        })

        res.json({
            success: true,
            count: comments.length,
            data: comments
        })
    } catch (error) {
        console.error('Error getting comments by video:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des commentaires',
            error: error.message
        })
    }
}

/**
 * Récupérer les commentaires d'un exposant
 * GET /api/v2/comments/exposant/:exposantId?salon=:salonId
 */
const getCommentsByExposantId = async (req, res) => {
    try {
        const { exposantId } = req.params
        const { salon } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        const comments = await Comment.find({ salon, exposantId, statut: 1 })
            .populate('videoId', 'name description videoUrl')
            .sort({ createdAt: -1 })

        res.json({
            success: true,
            count: comments.length,
            data: comments
        })
    } catch (error) {
        console.error('Error getting comments by exposant:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des commentaires',
            error: error.message
        })
    }
}

/**
 * Mettre à jour un commentaire
 * PUT /api/v2/comments/:id
 * Requiert authentification
 */
const updateComment = async (req, res) => {
    try {
        const { content } = req.body

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du commentaire ne peut pas être vide'
            })
        }

        if (content.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du commentaire ne doit pas dépasser 1000 caractères'
            })
        }

        const comment = await Comment.findById(req.params.id)

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Commentaire non trouvé'
            })
        }

        // Vérifier que le commentaire appartient à l'exposant connecté
        if (comment.exposantId.toString() !== req.exposantId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas le droit de modifier ce commentaire'
            })
        }

        // Mettre à jour le commentaire
        comment.content = content.trim()
        await comment.save()

        // Populate pour retourner les informations complètes
        await comment.populate('exposantId', 'nom profil email')
        await comment.populate('videoId', 'name description videoUrl')

        res.json({
            success: true,
            message: 'Commentaire mis à jour avec succès',
            data: comment
        })
    } catch (error) {
        console.error('Error updating comment:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du commentaire',
            error: error.message
        })
    }
}

/**
 * Supprimer un commentaire
 * DELETE /api/v2/comments/:id
 * Requiert authentification
 */
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Commentaire non trouvé'
            })
        }

        // Vérifier que le commentaire appartient à l'exposant connecté
        // ou que l'exposant est administrateur
        if (comment.exposantId.toString() !== req.exposantId.toString() && req.exposant.isValid !== 3) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas le droit de supprimer ce commentaire'
            })
        }

        // Soft delete : mettre statut à 0
        comment.statut = 0
        await comment.save()

        res.json({
            success: true,
            message: 'Commentaire supprimé avec succès'
        })
    } catch (error) {
        console.error('Error deleting comment:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du commentaire',
            error: error.message
        })
    }
}

/**
 * Récupérer les statistiques des commentaires pour une vidéo
 * GET /api/v2/comments/stats/video/:videoId?salon=:salonId
 */
const getCommentStats = async (req, res) => {
    try {
        const { videoId } = req.params
        const { salon } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        const count = await Comment.countDocuments({ salon, videoId, statut: 1 })

        res.json({
            success: true,
            data: {
                videoId,
                count
            }
        })
    } catch (error) {
        console.error('Error getting comment stats:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        })
    }
}

module.exports = {
    createComment,
    getCommentsByVideoId,
    getCommentsByExposantId,
    updateComment,
    deleteComment,
    getCommentStats
}

