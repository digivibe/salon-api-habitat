const Exposant = require('../models/Exposant')
const Categorie = require('../models/Categorie')
const ExposantVideo = require('../models/ExposantVideo')
const ExposantBondeal = require('../models/ExposantBondeal')
const Comment = require('../models/Comment')
const Like = require('../models/Like')
const Salon = require('../models/Salon')
const Event = require('../models/Event')
const User = require('../models/User')
const cloudinary = require('../config/cloudinary')

/**
 * Récupérer les statistiques globales
 * GET /api/v2/admin/stats?salon=:salonId
 * Requiert authentification admin
 */
const getStatistics = async (req, res) => {
    try {
        const { salon } = req.query

        const query = {}
        if (salon) {
            query.salon = salon
        }

        // Statistiques des exposants
        const exposantsStats = await Exposant.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$isValid',
                    count: { $sum: 1 }
                }
            }
        ])

        const exposantsByStatus = await Exposant.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$statut',
                    count: { $sum: 1 }
                }
            }
        ])

        // Compter les totaux
        const totalExposants = await Exposant.countDocuments(query)
        const activeExposants = await Exposant.countDocuments({ ...query, statut: 1 })
        const totalVideos = await ExposantVideo.countDocuments(query)
        const totalBondeals = await ExposantBondeal.countDocuments(query)
        const totalComments = await Comment.countDocuments(query)
        const totalLikes = await Like.countDocuments(query)
        const totalUsers = await User.countDocuments(query)
        const activeUsers = await User.countDocuments({ ...query, isActive: true })
        const totalEvents = await Event.countDocuments(query)

        res.json({
            success: true,
            data: {
                exposants: {
                    total: totalExposants,
                    active: activeExposants,
                    byValidation: exposantsStats,
                    byStatus: exposantsByStatus
                },
                content: {
                    videos: totalVideos,
                    bondeals: totalBondeals,
                    comments: totalComments,
                    likes: totalLikes,
                    events: totalEvents
                },
                users: {
                    total: totalUsers,
                    active: activeUsers
                }
            }
        })
    } catch (error) {
        console.error('Error getting statistics:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        })
    }
}

/**
 * Récupérer tous les exposants avec pagination et filtres
 * GET /api/v2/admin/exposants?salon=:salonId&page=1&limit=20&search=...
 * Requiert authentification admin
 */
const getAllExposants = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            isValid,
            statut,
            categorie,
            salon
        } = req.query

        // Construire le filtre
        const filter = {}

        if (salon) {
            filter.salon = salon
        }

        if (search) {
            filter.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ]
        }

        if (isValid !== undefined) {
            filter.isValid = parseInt(isValid)
        }

        if (statut !== undefined) {
            filter.statut = parseInt(statut)
        }

        if (categorie) {
            filter.categorie = categorie
        }

        // Calculer la pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Récupérer les exposants
        const exposants = await Exposant.find(filter)
            .populate('categorie', 'label color borderColor')
            .populate('salon', 'nom slug')
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean()

        // Compter le total
        const total = await Exposant.countDocuments(filter)

        res.json({
            success: true,
            data: exposants,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        })
    } catch (error) {
        console.error('Error getting exposants:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des exposants',
            error: error.message
        })
    }
}

/**
 * Récupérer un exposant par ID avec statistiques
 * GET /api/v2/admin/exposants/:id
 * Requiert authentification admin
 */
const getExposantById = async (req, res) => {
    try {
        const { id } = req.params

        const exposant = await Exposant.findById(id)
            .populate('categorie', 'label color borderColor')
            .populate('salon', 'nom slug')
            .select('-password')
            .lean()

        if (!exposant) {
            return res.status(404).json({
                success: false,
                message: 'Exposant non trouvé'
            })
        }

        // Récupérer les statistiques
        const stats = {
            videos: await ExposantVideo.countDocuments({ exposantId: id }),
            bondeals: await ExposantBondeal.countDocuments({ exposantId: id }),
            comments: await Comment.countDocuments({ exposantId: id }),
            likes: await Like.countDocuments({ exposantId: id })
        }

        res.json({
            success: true,
            data: {
                ...exposant,
                stats
            }
        })
    } catch (error) {
        console.error('Error getting exposant:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'exposant',
            error: error.message
        })
    }
}

/**
 * Créer un nouvel exposant
 * POST /api/v2/admin/exposants
 * Requiert authentification admin
 */
const createExposant = async (req, res) => {
    try {
        const {
            salon,
            categorie,
            email,
            username,
            password,
            nom,
            location,
            bio,
            phoneNumber,
            linkedinLink,
            facebookLink,
            instaLink,
            weblink,
            isValid = 2,
            statut = 1
        } = req.body

        // Validation des champs requis
        if (!salon || !categorie || !email || !username || !password || !nom || !location || !bio) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants (salon, categorie, email, username, password, nom, location, bio)'
            })
        }

        // Vérifier que le salon existe
        const salonExists = await Salon.findById(salon)
        if (!salonExists) {
            return res.status(400).json({
                success: false,
                message: 'Salon non trouvé'
            })
        }

        // Vérifier que la catégorie existe pour ce salon
        const categorieExists = await Categorie.findOne({ _id: categorie, salon })
        if (!categorieExists) {
            return res.status(400).json({
                success: false,
                message: 'Catégorie non trouvée pour ce salon'
            })
        }

        // Vérifier si l'email existe déjà pour ce salon
        const existingEmail = await Exposant.findOne({ salon, email })
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé pour ce salon'
            })
        }

        // Vérifier si le username existe déjà pour ce salon
        const existingUsername = await Exposant.findOne({ salon, username })
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Ce nom d\'utilisateur est déjà utilisé pour ce salon'
            })
        }

        // Créer le nouvel exposant
        const newExposant = await Exposant.create({
            salon,
            categorie,
            email: email.trim().toLowerCase(),
            username: username.trim(),
            password,
            nom: nom.trim(),
            location: location.trim(),
            bio: bio.trim(),
            phoneNumber: phoneNumber?.trim() || '',
            linkedinLink: linkedinLink?.trim() || '',
            facebookLink: facebookLink?.trim() || '',
            instaLink: instaLink?.trim() || '',
            weblink: weblink?.trim() || '',
            isValid,
            statut
        })

        const savedExposant = await Exposant.findById(newExposant._id)
            .populate('categorie', 'label color borderColor')
            .populate('salon', 'nom slug')
            .select('-password')

        res.status(201).json({
            success: true,
            message: 'Exposant créé avec succès',
            data: savedExposant
        })
    } catch (error) {
        console.error('Error creating exposant:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'exposant',
            error: error.message
        })
    }
}

/**
 * Mettre à jour un exposant
 * PUT /api/v2/admin/exposants/:id
 * Requiert authentification admin
 */
const updateExposant = async (req, res) => {
    try {
        const { id } = req.params
        const {
            categorie,
            email,
            username,
            nom,
            location,
            bio,
            phoneNumber,
            linkedinLink,
            facebookLink,
            instaLink,
            weblink,
            isValid,
            statut
        } = req.body

        const exposant = await Exposant.findById(id)

        if (!exposant) {
            return res.status(404).json({
                success: false,
                message: 'Exposant non trouvé'
            })
        }

        // Mettre à jour les champs fournis
        if (categorie !== undefined) exposant.categorie = categorie
        if (email !== undefined) exposant.email = email.trim().toLowerCase()
        if (username !== undefined) exposant.username = username.trim()
        if (nom !== undefined) exposant.nom = nom.trim()
        if (location !== undefined) exposant.location = location.trim()
        if (bio !== undefined) exposant.bio = bio.trim()
        if (phoneNumber !== undefined) exposant.phoneNumber = phoneNumber.trim()
        if (linkedinLink !== undefined) exposant.linkedinLink = linkedinLink.trim()
        if (facebookLink !== undefined) exposant.facebookLink = facebookLink.trim()
        if (instaLink !== undefined) exposant.instaLink = instaLink.trim()
        if (weblink !== undefined) exposant.weblink = weblink.trim()
        if (isValid !== undefined) exposant.isValid = isValid
        if (statut !== undefined) exposant.statut = statut

        await exposant.save()

        const updatedExposant = await Exposant.findById(id)
            .populate('categorie', 'label color borderColor')
            .populate('salon', 'nom slug')
            .select('-password')

        res.json({
            success: true,
            message: 'Exposant mis à jour avec succès',
            data: updatedExposant
        })
    } catch (error) {
        console.error('Error updating exposant:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'exposant',
            error: error.message
        })
    }
}

/**
 * Supprimer un exposant (soft delete par défaut, hard delete si hard=true)
 * DELETE /api/v2/admin/exposants/:id?hard=true
 * Requiert authentification admin
 */
const deleteExposant = async (req, res) => {
    try {
        const { id } = req.params
        const { hard } = req.query

        const exposant = await Exposant.findById(id)

        if (!exposant) {
            return res.status(404).json({
                success: false,
                message: 'Exposant non trouvé'
            })
        }

        // Hard delete : suppression complète avec cascade
        if (hard === 'true') {
            // Supprimer toutes les vidéos et leurs fichiers Cloudinary
            const videos = await ExposantVideo.find({ exposantId: id })
            for (const video of videos) {
                if (video.videoUrl) {
                    try {
                        // Extraire le public_id depuis l'URL
                        const publicId = extractPublicIdFromUrl(video.videoUrl)
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId, {
                                resource_type: 'video'
                            })
                        }
                    } catch (cloudinaryError) {
                        console.error('Error deleting video from Cloudinary:', cloudinaryError)
                    }
                }
            }

            // Supprimer tous les bondeals et leurs images Cloudinary
            const bondeals = await ExposantBondeal.find({ exposantId: id })
            for (const bondeal of bondeals) {
                if (bondeal.image) {
                    try {
                        const publicId = extractPublicIdFromUrl(bondeal.image)
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId, {
                                resource_type: 'image'
                            })
                        }
                    } catch (cloudinaryError) {
                        console.error('Error deleting image from Cloudinary:', cloudinaryError)
                    }
                }
            }

            // Supprimer la photo de profil et de couverture
            if (exposant.profil && !exposant.profil.includes('defaults/')) {
                try {
                    const publicId = extractPublicIdFromUrl(exposant.profil)
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId, {
                            resource_type: 'image'
                        })
                    }
                } catch (cloudinaryError) {
                    console.error('Error deleting profile pic from Cloudinary:', cloudinaryError)
                }
            }

            if (exposant.cover && !exposant.cover.includes('defaults/')) {
                try {
                    const publicId = extractPublicIdFromUrl(exposant.cover)
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId, {
                            resource_type: 'image'
                        })
                    }
                } catch (cloudinaryError) {
                    console.error('Error deleting cover pic from Cloudinary:', cloudinaryError)
                }
            }

            // Supprimer toutes les données associées
            await Promise.all([
                Comment.deleteMany({ exposantId: id }),
                ExposantBondeal.deleteMany({ exposantId: id }),
                ExposantVideo.deleteMany({ exposantId: id }),
                Like.deleteMany({ exposantId: id })
            ])

            // Supprimer l'exposant
            await Exposant.findByIdAndDelete(id)

            return res.json({
                success: true,
                message: 'Exposant supprimé définitivement avec toutes ses données associées'
            })
        }

        // Soft delete : mettre statut à 0
        exposant.statut = 0
        await exposant.save()

        res.json({
            success: true,
            message: 'Exposant désactivé avec succès'
        })
    } catch (error) {
        console.error('Error deleting exposant:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'exposant',
            error: error.message
        })
    }
}

/**
 * Fonction utilitaire pour extraire le public_id depuis une URL Cloudinary
 */
const extractPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
        return null
    }
    try {
        // Format Cloudinary: https://res.cloudinary.com/cloud_name/resource_type/upload/[transformations/]version/public_id.ext
        // Exemple: https://res.cloudinary.com/dfqiz1ndw/video/upload/v1762525679/oqhbkoucw96t5qfavqq4.mp4
        const parts = url.split('/')
        const uploadIndex = parts.indexOf('upload')
        if (uploadIndex === -1) return null
        
        // Tout après "upload/" contient les transformations (optionnel), version et public_id
        const afterUpload = parts.slice(uploadIndex + 1).join('/')
        
        // Enlever la version (commence par 'v' suivi de chiffres)
        // Format: v1234567890/public_id.ext ou transformations/v1234567890/public_id.ext
        const versionPattern = /^.*\/v\d+\/(.+)$/
        const match = afterUpload.match(versionPattern)
        
        if (match && match[1]) {
            // Enlever l'extension
            const publicId = match[1].split('.')[0]
            return publicId
        }
        
        // Si pas de version, prendre directement après upload/ et enlever l'extension
        const withoutVersion = afterUpload.split('/').pop()
        return withoutVersion ? withoutVersion.split('.')[0] : null
    } catch (error) {
        console.error('Error extracting public_id:', error)
        return null
    }
}

/**
 * Mettre à jour les permissions d'un exposant
 * PATCH /api/v2/admin/exposants/:id/permissions
 * Requiert authentification admin
 */
const updateExposantPermissions = async (req, res) => {
    try {
        const { id } = req.params
        const { isValid } = req.body

        if (isValid === undefined) {
            return res.status(400).json({
                success: false,
                message: 'isValid est requis'
            })
        }

        if (![0, 1, 2, 3].includes(isValid)) {
            return res.status(400).json({
                success: false,
                message: 'isValid doit être 0, 1, 2 ou 3'
            })
        }

        const exposant = await Exposant.findByIdAndUpdate(
            id,
            { isValid },
            { new: true }
        )
            .populate('categorie', 'label color borderColor')
            .populate('salon', 'nom slug')
            .select('-password')

        if (!exposant) {
            return res.status(404).json({
                success: false,
                message: 'Exposant non trouvé'
            })
        }

        res.json({
            success: true,
            message: 'Permissions mises à jour avec succès',
            data: exposant
        })
    } catch (error) {
        console.error('Error updating permissions:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des permissions',
            error: error.message
        })
    }
}

/**
 * Mettre à jour le statut d'un exposant
 * PATCH /api/v2/admin/exposants/:id/status
 * Requiert authentification admin
 */
const updateExposantStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { statut } = req.body

        if (statut === undefined) {
            return res.status(400).json({
                success: false,
                message: 'statut est requis'
            })
        }

        if (![0, 1].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'statut doit être 0 ou 1'
            })
        }

        const exposant = await Exposant.findByIdAndUpdate(
            id,
            { statut },
            { new: true }
        )
            .populate('categorie', 'label color borderColor')
            .populate('salon', 'nom slug')
            .select('-password')

        if (!exposant) {
            return res.status(404).json({
                success: false,
                message: 'Exposant non trouvé'
            })
        }

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            data: exposant
        })
    } catch (error) {
        console.error('Error updating status:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut',
            error: error.message
        })
    }
}

/**
 * Récupérer les vidéos d'un exposant (admin)
 * GET /api/v2/admin/exposants/:id/videos
 * Requiert authentification admin
 */
const getExposantVideos = async (req, res) => {
    try {
        const { id } = req.params

        const videos = await ExposantVideo.find({ exposantId: id })
            .sort({ createdAt: -1 })
            .lean()

        res.json({
            success: true,
            data: videos
        })
    } catch (error) {
        console.error('Error getting exposant videos:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des vidéos',
            error: error.message
        })
    }
}

/**
 * Supprimer une vidéo (admin)
 * DELETE /api/v2/admin/videos/:id
 * Requiert authentification admin
 */
const deleteVideoAdmin = async (req, res) => {
    try {
        const { id } = req.params

        const video = await ExposantVideo.findById(id)

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Vidéo non trouvée'
            })
        }

        // Supprimer la vidéo de Cloudinary
        if (video.videoUrl) {
            try {
                const publicId = extractPublicIdFromUrl(video.videoUrl)
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId, {
                        resource_type: 'video'
                    })
                }
            } catch (cloudinaryError) {
                console.error('Error deleting video from Cloudinary:', cloudinaryError)
            }
        }

        // Supprimer tous les commentaires et likes associés
        await Promise.all([
            Comment.deleteMany({ videoId: id }),
            Like.deleteMany({ videoId: id })
        ])

        await video.deleteOne()

        res.json({
            success: true,
            message: 'Vidéo supprimée avec succès'
        })
    } catch (error) {
        console.error('Error deleting video:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la vidéo',
            error: error.message
        })
    }
}

/**
 * Mettre à jour le statut d'une vidéo (admin)
 * PATCH /api/v2/admin/videos/:id/status
 * Requiert authentification admin
 */
const updateVideoStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { statut } = req.body

        if (statut === undefined) {
            return res.status(400).json({
                success: false,
                message: 'statut est requis'
            })
        }

        if (![0, 1].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'statut doit être 0 ou 1'
            })
        }

        const video = await ExposantVideo.findByIdAndUpdate(
            id,
            { statut },
            { new: true }
        )

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Vidéo non trouvée'
            })
        }

        res.json({
            success: true,
            message: `Vidéo ${statut === 1 ? 'activée' : 'désactivée'} avec succès`,
            data: video
        })
    } catch (error) {
        console.error('Error updating video status:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut de la vidéo',
            error: error.message
        })
    }
}

/**
 * Récupérer les bondeals d'un exposant (admin)
 * GET /api/v2/admin/exposants/:id/bondeals
 * Requiert authentification admin
 */
const getExposantBondeals = async (req, res) => {
    try {
        const { id } = req.params

        const bondeals = await ExposantBondeal.find({ exposantId: id })
            .sort({ createdAt: -1 })
            .lean()

        res.json({
            success: true,
            data: bondeals
        })
    } catch (error) {
        console.error('Error getting exposant bondeals:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des bondeals',
            error: error.message
        })
    }
}

/**
 * Supprimer un bondeal (admin)
 * DELETE /api/v2/admin/bondeals/:id
 * Requiert authentification admin
 */
const deleteBondealAdmin = async (req, res) => {
    try {
        const { id } = req.params

        const bondeal = await ExposantBondeal.findById(id)

        if (!bondeal) {
            return res.status(404).json({
                success: false,
                message: 'Bondeal non trouvé'
            })
        }

        // Supprimer l'image de Cloudinary
        if (bondeal.image) {
            try {
                const publicId = extractPublicIdFromUrl(bondeal.image)
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId, {
                        resource_type: 'image'
                    })
                }
            } catch (cloudinaryError) {
                console.error('Error deleting image from Cloudinary:', cloudinaryError)
            }
        }

        await bondeal.deleteOne()

        res.json({
            success: true,
            message: 'Bondeal supprimé avec succès'
        })
    } catch (error) {
        console.error('Error deleting bondeal:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du bondeal',
            error: error.message
        })
    }
}

module.exports = {
    getStatistics,
    getAllExposants,
    getExposantById,
    createExposant,
    updateExposant,
    deleteExposant,
    updateExposantPermissions,
    updateExposantStatus,
    getExposantVideos,
    deleteVideoAdmin,
    updateVideoStatus,
    getExposantBondeals,
    deleteBondealAdmin
}

