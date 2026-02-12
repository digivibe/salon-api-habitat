const bcrypt = require('bcryptjs')
const Exposant = require('../models/Exposant')
const ExposantVideo = require('../models/ExposantVideo')
const ExposantBondeal = require('../models/ExposantBondeal')
const cloudinary = require('../config/cloudinary')

/**
 * Récupérer tous les exposants d'un salon
 * GET /api/v2/exposants?salon=:salonId&categorie=:categorieId
 */
const getAllExposants = async (req, res) => {
    try {
        const { salon, categorie } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        // Construire le filtre
        const filter = { salon, statut: 1 }
        
        // Ajouter le filtre par catégorie si fourni
        if (categorie) {
            filter.categorie = categorie
        }

        const exposants = await Exposant.find(filter)
            .populate('categorie', 'label color borderColor')
            .select('-password')
            .sort({ nom: 1 })

        // Tri personnalisé : lettres avant chiffres
        const sortedExposants = exposants.sort((a, b) => {
            const nameA = a.nom.toLowerCase().trim()
            const nameB = b.nom.toLowerCase().trim()
            
            const startsWithNumberA = /^[0-9]/.test(nameA)
            const startsWithNumberB = /^[0-9]/.test(nameB)
            
            if (startsWithNumberA && !startsWithNumberB) return 1
            if (!startsWithNumberA && startsWithNumberB) return -1
            
            return nameA.localeCompare(nameB, 'fr', {
                sensitivity: 'base',
                ignorePunctuation: true
            })
        })

        res.json({
            success: true,
            count: sortedExposants.length,
            data: sortedExposants
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
 * Récupérer un exposant par ID
 * GET /api/v2/exposants/:id
 */
const getExposantById = async (req, res) => {
    try {
        const exposant = await Exposant.findById(req.params.id)
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
            data: exposant
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
 * Publier une nouvelle vidéo
 * POST /api/v2/exposants/videos
 * Requiert authentification
 */
const postNewVideo = async (req, res) => {
    try {
        console.log('📹 [postNewVideo] Requête reçue')
        console.log('📹 [postNewVideo] Exposant:', req.exposantId)
        console.log('📹 [postNewVideo] Body:', req.body)
        console.log('📹 [postNewVideo] File:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            cloudinaryUrl: req.file.cloudinaryUrl
        } : 'Aucun fichier')

        const { description } = req.body

        if (!req.file) {
            console.error('❌ [postNewVideo] Aucun fichier reçu')
            return res.status(400).json({
                success: false,
                message: 'Vidéo requise. Aucun fichier reçu.'
            })
        }

        if (!req.file.cloudinaryUrl) {
            console.error('❌ [postNewVideo] Aucune URL Cloudinary')
            return res.status(400).json({
                success: false,
                message: 'Erreur lors de l\'upload vers Cloudinary. URL manquante.'
            })
        }

        if (!description || description.trim().length === 0) {
            console.error('❌ [postNewVideo] Description manquante')
            return res.status(400).json({
                success: false,
                message: 'Description requise'
            })
        }

        // L'exposant est déjà dans req.exposant grâce au middleware requireAuth
        console.log('📹 [postNewVideo] Création de la vidéo pour exposant:', req.exposantId)
        const newVideo = await ExposantVideo.create({
            salon: req.exposant.salon,
            exposantId: req.exposantId,
            name: req.file.cloudinaryUrl,
            videoUrl: req.file.cloudinaryUrl,
            description: description.trim(),
            statut: 1
        })

        console.log('✅ [postNewVideo] Vidéo créée avec succès:', newVideo._id)
        res.status(201).json({
            success: true,
            message: 'Vidéo publiée avec succès',
            data: newVideo
        })
    } catch (error) {
        console.error('❌ [postNewVideo] Erreur:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la publication de la vidéo',
            error: error.message
        })
    }
}

/**
 * Supprimer une vidéo
 * DELETE /api/v2/exposants/videos/:id
 * Requiert authentification
 */
const deleteVideo = async (req, res) => {
    try {
        const video = await ExposantVideo.findById(req.params.id)

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Vidéo non trouvée'
            })
        }

        // Vérifier que la vidéo appartient à l'exposant connecté
        if (video.exposantId.toString() !== req.exposantId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas le droit de supprimer cette vidéo'
            })
        }

        // Supprimer la vidéo de Cloudinary
        if (video.videoUrl) {
            try {
                await cloudinary.uploader.destroy(video.videoUrl, {
                    resource_type: 'video'
                })
            } catch (cloudinaryError) {
                console.error('Error deleting video from Cloudinary:', cloudinaryError)
            }
        }

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
 * Récupérer les vidéos d'un exposant
 * GET /api/v2/exposants/videos?exposantId=:id
 * Si l'utilisateur est authentifié, filtre automatiquement par son ID
 */
const getVideos = async (req, res) => {
    try {
        const { exposantId, salon } = req.query

        let query = { statut: 1 }

        // Si l'utilisateur est authentifié, filtrer automatiquement par son ID
        if (req.exposantId) {
            query.exposantId = req.exposantId
        } else if (exposantId) {
            query.exposantId = exposantId
        }

        if (salon) {
            query.salon = salon
        }

        const videos = await ExposantVideo.find(query)
            .populate('exposantId', 'nom profil email')
            .sort({ createdAt: -1 })

        res.json({
            success: true,
            count: videos.length,
            data: videos
        })
    } catch (error) {
        console.error('Error getting videos:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des vidéos',
            error: error.message
        })
    }
}

/**
 * Publier un nouveau bondeal
 * POST /api/v2/exposants/bondeals
 * Requiert authentification
 */
const postNewBondeal = async (req, res) => {
    try {
        const { title, description } = req.body

        if (!req.file || !req.file.cloudinaryUrl) {
            return res.status(400).json({
                success: false,
                message: 'Image requise'
            })
        }

        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Titre requis'
            })
        }

        if (!description || description.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Description requise'
            })
        }

        const newBondeal = await ExposantBondeal.create({
            salon: req.exposant.salon,
            exposantId: req.exposantId,
            image: req.file.cloudinaryUrl,
            title: title.trim(),
            description: description.trim(),
            statut: 1
        })

        res.status(201).json({
            success: true,
            message: 'Bondeal publié avec succès',
            data: newBondeal
        })
    } catch (error) {
        console.error('Error posting bondeal:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la publication du bondeal',
            error: error.message
        })
    }
}

/**
 * Supprimer un bondeal
 * DELETE /api/v2/exposants/bondeals/:id
 * Requiert authentification
 */
const deleteBondeal = async (req, res) => {
    try {
        const bondeal = await ExposantBondeal.findById(req.params.id)

        if (!bondeal) {
            return res.status(404).json({
                success: false,
                message: 'Bondeal non trouvé'
            })
        }

        // Vérifier que le bondeal appartient à l'exposant connecté
        if (bondeal.exposantId.toString() !== req.exposantId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas le droit de supprimer ce bondeal'
            })
        }

        // Supprimer l'image de Cloudinary
        if (bondeal.image) {
            try {
                await cloudinary.uploader.destroy(bondeal.image, {
                    resource_type: 'image'
                })
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

/**
 * Récupérer les bondeals d'un exposant
 * GET /api/v2/exposants/bondeals?exposantId=:id
 * Si l'utilisateur est authentifié, filtre automatiquement par son ID
 */
const getBondeals = async (req, res) => {
    try {
        const { exposantId, salon } = req.query

        let query = { statut: 1 }

        // Si l'utilisateur est authentifié, filtrer automatiquement par son ID
        if (req.exposantId) {
            query.exposantId = req.exposantId
        } else if (exposantId) {
            query.exposantId = exposantId
        }

        if (salon) {
            query.salon = salon
        }

        const bondeals = await ExposantBondeal.find(query)
            .populate('exposantId', 'nom profil email')
            .sort({ createdAt: -1 })

        res.json({
            success: true,
            count: bondeals.length,
            data: bondeals
        })
    } catch (error) {
        console.error('Error getting bondeals:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des bondeals',
            error: error.message
        })
    }
}

/**
 * Mettre à jour la photo de profil
 * POST /api/v2/exposants/profile-pic
 * Requiert authentification
 */
const updateProfilePic = async (req, res) => {
    try {
        console.log('📸 [updateProfilePic] Début mise à jour photo de profil')
        console.log('📸 [updateProfilePic] Exposant:', req.exposantId)
        console.log('📸 [updateProfilePic] Fichier:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            cloudinaryUrl: req.file.cloudinaryUrl,
            size: req.file.size
        } : 'Aucun fichier')

        if (!req.file) {
            console.error('❌ [updateProfilePic] Aucun fichier dans req.file')
            return res.status(400).json({
                success: false,
                message: 'Image requise. Aucun fichier reçu.'
            })
        }

        if (!req.file.cloudinaryUrl) {
            console.error('❌ [updateProfilePic] Aucune URL Cloudinary')
            return res.status(400).json({
                success: false,
                message: 'Erreur lors de l\'upload vers Cloudinary. URL manquante.'
            })
        }

        // Fonction helper pour extraire le public_id depuis une URL Cloudinary
        const extractPublicId = (url) => {
            if (!url) return null
            try {
                const parts = url.split('/')
                const uploadIndex = parts.indexOf('upload')
                if (uploadIndex === -1) return null
                const afterUpload = parts.slice(uploadIndex + 2) // Skip 'upload' and version number
                const lastPart = afterUpload[afterUpload.length - 1]
                return lastPart.split('.')[0] // Remove extension
            } catch (error) {
                console.error('Error extracting public_id from URL:', error)
                return null
            }
        }

        // Supprimer l'ancienne photo de profil de Cloudinary si elle existe
        const oldProfileUrl = req.exposant.profil
        if (oldProfileUrl && oldProfileUrl !== process.env.DEFAULT_PROFILE_PIC) {
            try {
                const publicId = extractPublicId(oldProfileUrl)
                if (publicId) {
                    console.log('🗑️ [updateProfilePic] Suppression ancienne photo:', publicId)
                    const deleteResult = await cloudinary.uploader.destroy(publicId, {
                        resource_type: 'image'
                    })
                    console.log('🗑️ [updateProfilePic] Résultat suppression:', deleteResult.result)
                } else {
                    console.warn('⚠️ [updateProfilePic] Impossible d\'extraire public_id de l\'URL:', oldProfileUrl)
                }
            } catch (cloudinaryError) {
                // Ne pas bloquer la mise à jour si la suppression échoue
                console.error('⚠️ [updateProfilePic] Erreur lors de la suppression de l\'ancienne photo (non bloquant):', cloudinaryError.message)
            }
        }

        // Mettre à jour la photo de profil
        req.exposant.profil = req.file.cloudinaryUrl
        await req.exposant.save()

        console.log('✅ [updateProfilePic] Photo de profil mise à jour avec succès')
        res.json({
            success: true,
            message: 'Photo de profil mise à jour avec succès',
            data: {
                profil: req.exposant.profil
            }
        })
    } catch (error) {
        console.error('❌ [updateProfilePic] Erreur:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la photo de profil',
            error: error.message
        })
    }
}

/**
 * Mettre à jour la photo de couverture
 * POST /api/v2/exposants/cover-pic
 * Requiert authentification
 */
const updateCoverPic = async (req, res) => {
    try {
        console.log('🖼️ [updateCoverPic] Début mise à jour photo de couverture')
        console.log('🖼️ [updateCoverPic] Exposant:', req.exposantId)
        console.log('🖼️ [updateCoverPic] Fichier:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            cloudinaryUrl: req.file.cloudinaryUrl,
            size: req.file.size
        } : 'Aucun fichier')

        if (!req.file) {
            console.error('❌ [updateCoverPic] Aucun fichier dans req.file')
            return res.status(400).json({
                success: false,
                message: 'Image requise. Aucun fichier reçu.'
            })
        }

        if (!req.file.cloudinaryUrl) {
            console.error('❌ [updateCoverPic] Aucune URL Cloudinary')
            return res.status(400).json({
                success: false,
                message: 'Erreur lors de l\'upload vers Cloudinary. URL manquante.'
            })
        }

        // Fonction helper pour extraire le public_id depuis une URL Cloudinary
        const extractPublicId = (url) => {
            if (!url) return null
            try {
                const parts = url.split('/')
                const uploadIndex = parts.indexOf('upload')
                if (uploadIndex === -1) return null
                const afterUpload = parts.slice(uploadIndex + 2) // Skip 'upload' and version number
                const lastPart = afterUpload[afterUpload.length - 1]
                return lastPart.split('.')[0] // Remove extension
            } catch (error) {
                console.error('Error extracting public_id from URL:', error)
                return null
            }
        }

        // Supprimer l'ancienne photo de couverture de Cloudinary si elle existe
        const oldCoverUrl = req.exposant.cover
        if (oldCoverUrl && oldCoverUrl !== process.env.DEFAULT_COVER_PIC) {
            try {
                const publicId = extractPublicId(oldCoverUrl)
                if (publicId) {
                    console.log('🗑️ [updateCoverPic] Suppression ancienne photo:', publicId)
                    const deleteResult = await cloudinary.uploader.destroy(publicId, {
                        resource_type: 'image'
                    })
                    console.log('🗑️ [updateCoverPic] Résultat suppression:', deleteResult.result)
                } else {
                    console.warn('⚠️ [updateCoverPic] Impossible d\'extraire public_id de l\'URL:', oldCoverUrl)
                }
            } catch (cloudinaryError) {
                // Ne pas bloquer la mise à jour si la suppression échoue
                console.error('⚠️ [updateCoverPic] Erreur lors de la suppression de l\'ancienne photo (non bloquant):', cloudinaryError.message)
            }
        }

        // Mettre à jour la photo de couverture
        req.exposant.cover = req.file.cloudinaryUrl
        await req.exposant.save()

        console.log('✅ [updateCoverPic] Photo de couverture mise à jour avec succès')
        res.json({
            success: true,
            message: 'Photo de couverture mise à jour avec succès',
            data: {
                cover: req.exposant.cover
            }
        })
    } catch (error) {
        console.error('❌ [updateCoverPic] Erreur:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la photo de couverture',
            error: error.message
        })
    }
}

/**
 * Mettre à jour les informations de l'exposant
 * PUT /api/v2/exposants/infos
 * Requiert authentification
 */
const updateInfos = async (req, res) => {
    try {
        const { nom, bio, location, phoneNumber, linkedinLink, facebookLink, instaLink, weblink } = req.body

        // Mettre à jour les champs fournis
        if (nom !== undefined) req.exposant.nom = nom.trim()
        if (bio !== undefined) req.exposant.bio = bio.trim()
        if (location !== undefined) req.exposant.location = location.trim()
        if (phoneNumber !== undefined) req.exposant.phoneNumber = phoneNumber.trim()
        if (linkedinLink !== undefined) req.exposant.linkedinLink = linkedinLink.trim()
        if (facebookLink !== undefined) req.exposant.facebookLink = facebookLink.trim()
        if (instaLink !== undefined) req.exposant.instaLink = instaLink.trim()
        if (weblink !== undefined) req.exposant.weblink = weblink.trim()

        await req.exposant.save()

        const exposantData = req.exposant.toObject()
        delete exposantData.password

        res.json({
            success: true,
            message: 'Informations mises à jour avec succès',
            data: exposantData
        })
    } catch (error) {
        console.error('Error updating infos:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des informations',
            error: error.message
        })
    }
}

/**
 * Changer le mot de passe
 * PUT /api/v2/exposants/password
 * Requiert authentification
 */
const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Ancien et nouveau mot de passe requis'
            })
        }

        if (newPassword.length < 5 || newPassword.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir entre 5 et 20 caractères'
            })
        }

        // Vérifier l'ancien mot de passe
        const isPasswordValid = await req.exposant.comparePassword(oldPassword)
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Ancien mot de passe incorrect'
            })
        }

        // Mettre à jour le mot de passe
        req.exposant.password = newPassword
        await req.exposant.save()

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        })
    } catch (error) {
        console.error('Error updating password:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification du mot de passe',
            error: error.message
        })
    }
}

/**
 * Supprimer le compte
 * DELETE /api/v2/exposants/account
 * Requiert authentification
 */
const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe requis pour confirmer la suppression'
            })
        }

        // Vérifier le mot de passe
        const isPasswordValid = await req.exposant.comparePassword(password)
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe incorrect'
            })
        }

        // Soft delete : mettre statut à 0
        req.exposant.statut = 0
        await req.exposant.save()

        res.json({
            success: true,
            message: 'Compte supprimé avec succès'
        })
    } catch (error) {
        console.error('Error deleting account:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du compte',
            error: error.message
        })
    }
}

module.exports = {
    getAllExposants,
    getExposantById,
    postNewVideo,
    deleteVideo,
    getVideos,
    postNewBondeal,
    deleteBondeal,
    getBondeals,
    updateProfilePic,
    updateCoverPic,
    updateInfos,
    updatePassword,
    deleteAccount
}

