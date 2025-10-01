const UnifiedComment = require("../models/unifiedCommentModel")

/**
 * Créer un commentaire unifié
 */
exports.createUnifiedComment = async (req, res) => {
    const { exposantId, videoId, content, salonOrigin, exposantData, videoData } = req.body

    try {
        // Validation
        if (!exposantId || !videoId || !content || !salonOrigin) {
            return res.status(400).json({ 
                error: "Données manquantes",
                message: "exposantId, videoId, content et salonOrigin sont requis" 
            })
        }

        if (content.trim().length === 0) {
            return res.status(400).json({ 
                error: "Contenu vide",
                message: "Le commentaire ne peut pas être vide" 
            })
        }

        // Créer le commentaire
        const newComment = new UnifiedComment({
            exposantId: exposantId.toString(),
            videoId: videoId.toString(),
            content: content.trim(),
            salonOrigin,
            exposantData: exposantData || {},
            videoData: videoData || {}
        })

        await newComment.save()
        console.log(`[UnifiedComment] ${exposantId} a commenté ${videoId} (${salonOrigin})`)

        res.status(201).json(newComment)
    } catch (error) {
        console.error('Erreur création commentaire unifié:', error)
        res.status(400).json({ error: error.message })
    }
}

/**
 * Récupérer les commentaires d'une vidéo
 */
exports.getCommentsByVideoId = async (req, res) => {
    try {
        const { videoId } = req.params

        const comments = await UnifiedComment.find({ 
            videoId: videoId.toString() 
        }).sort({ createdAt: -1 })

        res.status(200).json(comments)
    } catch (error) {
        console.error('Erreur récupération commentaires:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Récupérer les commentaires d'un exposant
 */
exports.getCommentsByExposantId = async (req, res) => {
    try {
        const { exposantId } = req.params

        const comments = await UnifiedComment.find({ 
            exposantId: exposantId.toString() 
        }).sort({ createdAt: -1 })

        res.status(200).json(comments)
    } catch (error) {
        console.error('Erreur récupération commentaires exposant:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Récupérer tous les commentaires d'un salon
 */
exports.getCommentsBySalon = async (req, res) => {
    try {
        const { salon } = req.params

        const comments = await UnifiedComment.find({ 
            salonOrigin: salon 
        }).sort({ createdAt: -1 })

        res.status(200).json(comments)
    } catch (error) {
        console.error('Erreur récupération commentaires par salon:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Mettre à jour un commentaire
 */
exports.updateUnifiedComment = async (req, res) => {
    try {
        const { id } = req.params
        const { content, exposantId } = req.body

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ 
                error: "Contenu vide",
                message: "Le commentaire ne peut pas être vide" 
            })
        }

        const comment = await UnifiedComment.findById(id)

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé" })
        }

        // Vérifier que c'est bien le propriétaire
        if (exposantId && comment.exposantId !== exposantId.toString()) {
            return res.status(403).json({ 
                error: "Action interdite",
                message: "Vous ne pouvez modifier que vos propres commentaires"
            })
        }

        comment.content = content.trim()
        await comment.save()

        console.log(`[UnifiedComment] Commentaire ${id} mis à jour`)

        res.status(200).json(comment)
    } catch (error) {
        console.error('Erreur mise à jour commentaire:', error)
        res.status(400).json({ error: error.message })
    }
}

/**
 * Supprimer un commentaire
 */
exports.deleteUnifiedComment = async (req, res) => {
    try {
        const { id } = req.params
        const { exposantId } = req.body

        const comment = await UnifiedComment.findById(id)

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé" })
        }

        // Vérifier que c'est bien le propriétaire (ou admin)
        if (exposantId && comment.exposantId !== exposantId.toString()) {
            return res.status(403).json({ 
                error: "Action interdite",
                message: "Vous ne pouvez supprimer que vos propres commentaires"
            })
        }

        await UnifiedComment.findByIdAndDelete(id)

        console.log(`[UnifiedComment] Commentaire ${id} supprimé`)

        res.status(200).json({ 
            message: "Commentaire supprimé avec succès" 
        })
    } catch (error) {
        console.error('Erreur suppression commentaire:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Statistiques des commentaires
 */
exports.getCommentsStats = async (req, res) => {
    try {
        const stats = await UnifiedComment.aggregate([
            {
                $group: {
                    _id: "$salonOrigin",
                    totalComments: { $sum: 1 },
                    uniqueExposants: { $addToSet: "$exposantId" },
                    uniqueVideos: { $addToSet: "$videoId" },
                    avgCommentLength: { $avg: { $strLenCP: "$content" } }
                }
            },
            {
                $project: {
                    salon: "$_id",
                    totalComments: 1,
                    uniqueExposants: { $size: "$uniqueExposants" },
                    uniqueVideos: { $size: "$uniqueVideos" },
                    avgCommentLength: { $round: ["$avgCommentLength", 0] }
                }
            }
        ])

        res.status(200).json(stats)
    } catch (error) {
        console.error('Erreur stats commentaires:', error)
        res.status(500).json({ error: error.message })
    }
}