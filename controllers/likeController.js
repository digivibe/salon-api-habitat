const Like = require('../models/Like')
const Exposant = require('../models/Exposant')
const ExposantVideo = require('../models/ExposantVideo')

/**
 * Toggle like (créer ou supprimer)
 * POST /api/v2/likes/toggle
 * Requiert authentification
 */
const toggleLike = async (req, res) => {
    try {
        const { videoId } = req.body

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Video ID requis'
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
        const videoSalon = video.salon.toString()
        const exposantSalon = req.exposant.salon?.toString()

        if (!exposantSalon || videoSalon !== exposantSalon) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez liker que les vidéos de votre salon'
            })
        }

        // Vérifier si le like existe déjà (actif ou inactif)
        const existingLike = await Like.findOne({
            salon: req.exposant.salon,
            exposantId: req.exposantId,
            videoId: videoId
        })

        if (existingLike) {
            if (existingLike.statut === 1) {
                // Désactiver le like (soft delete)
                existingLike.statut = 0
                await existingLike.save()
                console.log('👍 [LikeController] Like désactivé:', {
                    videoId,
                    exposantId: req.exposantId,
                    statut: existingLike.statut
                })
                return res.json({
                    success: true,
                    message: 'Like supprimé',
                    liked: false
                })
            } else {
                // Réactiver le like
                existingLike.statut = 1
                await existingLike.save()
                console.log('👍 [LikeController] Like réactivé:', {
                    videoId,
                    exposantId: req.exposantId,
                    statut: existingLike.statut
                })
                return res.json({
                    success: true,
                    message: 'Like ajouté',
                    liked: true,
                    data: existingLike
                })
            }
        } else {
            // Créer le like
            const newLike = await Like.create({
                salon: req.exposant.salon,
                exposantId: req.exposantId,
                videoId: videoId,
                statut: 1
            })

            console.log('👍 [LikeController] Like créé:', {
                videoId,
                exposantId: req.exposantId,
                salon: req.exposant.salon,
                statut: newLike.statut
            })

            return res.status(201).json({
                success: true,
                message: 'Like ajouté',
                liked: true,
                data: newLike
            })
        }
    } catch (error) {
        console.error('Error toggling like:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors du toggle du like',
            error: error.message
        })
    }
}

/**
 * Récupérer les likes d'une vidéo
 * GET /api/v2/likes/video/:videoId?salon=:salonId
 */
const getLikesByVideoId = async (req, res) => {
    try {
        const { videoId } = req.params
        const { salon } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        const likes = await Like.find({ salon, videoId, statut: 1 })
            .populate('exposantId', 'nom profil email')
            .sort({ createdAt: -1 })

        res.json({
            success: true,
            count: likes.length,
            data: likes
        })
    } catch (error) {
        console.error('Error getting likes by video:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des likes',
            error: error.message
        })
    }
}

/**
 * Récupérer les likes d'un exposant
 * GET /api/v2/likes/exposant/:exposantId?salon=:salonId
 */
const getLikesByExposantId = async (req, res) => {
    try {
        const { exposantId } = req.params
        const { salon } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        const likes = await Like.find({ salon, exposantId, statut: 1 })
            .populate('videoId', 'name description videoUrl')
            .sort({ createdAt: -1 })

        res.json({
            success: true,
            count: likes.length,
            data: likes
        })
    } catch (error) {
        console.error('Error getting likes by exposant:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des likes',
            error: error.message
        })
    }
}

/**
 * Vérifier si un exposant a liké une vidéo
 * GET /api/v2/likes/check?videoId=:id
 * Requiert authentification
 */
const checkLike = async (req, res) => {
    try {
        const { videoId } = req.query

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Video ID requis dans la query (?videoId=:id)'
            })
        }

        const like = await Like.findOne({
            salon: req.exposant.salon,
            exposantId: req.exposantId,
            videoId: videoId,
            statut: 1
        })

        res.json({
            success: true,
            liked: !!like,
            data: like || null
        })
    } catch (error) {
        console.error('Error checking like:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification du like',
            error: error.message
        })
    }
}

/**
 * Supprimer un like
 * DELETE /api/v2/likes/:id
 * Requiert authentification
 */
const deleteLike = async (req, res) => {
    try {
        const like = await Like.findById(req.params.id)

        if (!like) {
            return res.status(404).json({
                success: false,
                message: 'Like non trouvé'
            })
        }

        // Vérifier que le like appartient à l'exposant connecté
        if (like.exposantId.toString() !== req.exposantId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas le droit de supprimer ce like'
            })
        }

        await like.deleteOne()

        res.json({
            success: true,
            message: 'Like supprimé avec succès'
        })
    } catch (error) {
        console.error('Error deleting like:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du like',
            error: error.message
        })
    }
}

/**
 * Récupérer les statistiques des likes pour une vidéo
 * GET /api/v2/likes/stats/video/:videoId?salon=:salonId
 */
const getLikeStats = async (req, res) => {
    try {
        const { videoId } = req.params
        const { salon } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        const count = await Like.countDocuments({ salon, videoId, statut: 1 })
        
        // Vérifier aussi les likes réels pour debug
        const likes = await Like.find({ salon, videoId, statut: 1 }).select('_id exposantId statut createdAt')
        
        console.log('📊 [LikeController] Stats likes:', {
            videoId,
            salon,
            count,
            likesCount: likes.length,
            likes: likes.map(l => ({
                id: l._id,
                exposantId: l.exposantId,
                statut: l.statut,
                createdAt: l.createdAt
            }))
        })

        res.json({
            success: true,
            data: {
                videoId,
                count
            }
        })
    } catch (error) {
        console.error('Error getting like stats:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        })
    }
}

module.exports = {
    toggleLike,
    getLikesByVideoId,
    getLikesByExposantId,
    checkLike,
    deleteLike,
    getLikeStats
}

