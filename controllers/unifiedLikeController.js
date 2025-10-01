const UnifiedLike = require("../models/unifiedLikeModel")

/**
 * Toggle like unifié - fonctionne pour tous les salons
 */
exports.toggleUnifiedLike = async (req, res) => {
    const { exposantId, videoId, salonOrigin, exposantData, videoData } = req.body

    try {
        // Validation
        if (!exposantId || !videoId || !salonOrigin) {
            return res.status(400).json({ 
                error: "Données manquantes",
                message: "exposantId, videoId et salonOrigin sont requis" 
            })
        }

        // Vérifier si le like existe déjà
        const existingLike = await UnifiedLike.findOne({ 
            exposantId: exposantId.toString(), 
            videoId: videoId.toString() 
        })

        if (existingLike) {
            // Unlike
            await UnifiedLike.findByIdAndDelete(existingLike._id)
            console.log(`[UnifiedLike] ${exposantId} a unliké ${videoId} (${salonOrigin})`)
        } else {
            // Like
            const newLike = new UnifiedLike({
                exposantId: exposantId.toString(),
                videoId: videoId.toString(),
                salonOrigin,
                exposantData: exposantData || {},
                videoData: videoData || {}
            })
            await newLike.save()
            console.log(`[UnifiedLike] ${exposantId} a liké ${videoId} (${salonOrigin})`)
        }

        // Retourner tous les likes de cette vidéo
        const allLikes = await UnifiedLike.find({ 
            videoId: videoId.toString() 
        })

        res.status(200).json(allLikes)
    } catch (error) {
        console.error('Erreur toggle unified like:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Récupérer les likes d'une vidéo
 */
exports.getLikesByVideoId = async (req, res) => {
    try {
        const { videoId } = req.params

        const likes = await UnifiedLike.find({ 
            videoId: videoId.toString() 
        }).sort({ createdAt: -1 })

        res.status(200).json(likes)
    } catch (error) {
        console.error('Erreur récupération likes:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Récupérer les likes d'un exposant
 */
exports.getLikesByExposantId = async (req, res) => {
    try {
        const { exposantId } = req.params

        const likes = await UnifiedLike.find({ 
            exposantId: exposantId.toString() 
        }).sort({ createdAt: -1 })

        res.status(200).json(likes)
    } catch (error) {
        console.error('Erreur récupération likes exposant:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Récupérer tous les likes d'un salon
 */
exports.getLikesBySalon = async (req, res) => {
    try {
        const { salon } = req.params

        const likes = await UnifiedLike.find({ 
            salonOrigin: salon 
        }).sort({ createdAt: -1 })

        res.status(200).json(likes)
    } catch (error) {
        console.error('Erreur récupération likes par salon:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Supprimer un like (admin ou propriétaire)
 */
exports.deleteUnifiedLike = async (req, res) => {
    try {
        const { id } = req.params

        const deletedLike = await UnifiedLike.findByIdAndDelete(id)

        if (!deletedLike) {
            return res.status(404).json({ message: "Like non trouvé" })
        }

        res.status(200).json({ 
            message: "Like supprimé avec succès",
            deletedLike 
        })
    } catch (error) {
        console.error('Erreur suppression like:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Statistiques des likes
 */
exports.getLikesStats = async (req, res) => {
    try {
        const stats = await UnifiedLike.aggregate([
            {
                $group: {
                    _id: "$salonOrigin",
                    totalLikes: { $sum: 1 },
                    uniqueExposants: { $addToSet: "$exposantId" },
                    uniqueVideos: { $addToSet: "$videoId" }
                }
            },
            {
                $project: {
                    salon: "$_id",
                    totalLikes: 1,
                    uniqueExposants: { $size: "$uniqueExposants" },
                    uniqueVideos: { $size: "$uniqueVideos" }
                }
            }
        ])

        res.status(200).json(stats)
    } catch (error) {
        console.error('Erreur stats likes:', error)
        res.status(500).json({ error: error.message })
    }
}