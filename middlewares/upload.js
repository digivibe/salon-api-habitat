const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cloudinary = require('../config/cloudinary')

// Configuration de multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Créer le dossier uploads s'il n'existe pas
        const uploadDir = 'uploads/'
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        // Ajouter un timestamp au nom du fichier pour éviter les doublons
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

// Filtre pour accepter uniquement les images et vidéos
const fileFilter = (req, file, cb) => {
    console.log('📁 [fileFilter] Vérification du fichier:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        encoding: file.encoding
    })

    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo'
    ]

    // Vérifier d'abord le mimetype exact
    if (allowedMimes.includes(file.mimetype)) {
        console.log('✅ [fileFilter] Type MIME autorisé:', file.mimetype)
        return cb(null, true)
    }

    // Vérifier aussi par extension de fichier (pour React Native qui peut mal détecter le type)
    const extension = path.extname(file.originalname).toLowerCase()
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mpeg', '.mpg']

    if (imageExtensions.includes(extension)) {
        console.log('✅ [fileFilter] Extension image autorisée:', extension)
        // Forcer le mimetype si nécessaire
        if (!file.mimetype.startsWith('image/')) {
            file.mimetype = 'image/jpeg' // Par défaut
        }
        return cb(null, true)
    }

    if (videoExtensions.includes(extension)) {
        console.log('✅ [fileFilter] Extension vidéo autorisée:', extension)
        // Forcer le mimetype si nécessaire
        if (!file.mimetype.startsWith('video/')) {
            file.mimetype = 'video/mp4' // Par défaut
        }
        return cb(null, true)
    }

    console.error('❌ [fileFilter] Type de fichier non autorisé:', {
        mimetype: file.mimetype,
        extension: extension,
        originalname: file.originalname
    })
    cb(new Error(`Type de fichier non autorisé: ${file.mimetype || extension}. Seules les images et vidéos sont acceptées.`), false)
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max
    }
})

/**
 * Middleware pour télécharger un fichier sur Cloudinary
 * Gère automatiquement les types de fichiers (vidéo, image)
 */
const uploadToCloudinary = (req, res, next) => {
    console.log('☁️ [uploadToCloudinary] Début upload vers Cloudinary')
    console.log('☁️ [uploadToCloudinary] Requête:', {
        method: req.method,
        path: req.path,
        headers: {
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length']
        },
        body: req.body ? Object.keys(req.body) : 'no body',
        file: req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'no file'
    })
    
    if (!req.file) {
        console.error('❌ [uploadToCloudinary] Aucun fichier dans req.file')
        console.error('❌ [uploadToCloudinary] Vérification multer:', {
            hasFiles: !!req.files,
            filesKeys: req.files ? Object.keys(req.files) : [],
            bodyKeys: req.body ? Object.keys(req.body) : []
        })
        return res.status(400).json({
            success: false,
            message: 'Aucun fichier téléchargé. Assurez-vous que le champ du formulaire correspond au nom attendu.'
        })
    }

    console.log('☁️ [uploadToCloudinary] Fichier reçu:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        encoding: req.file.encoding
    })

    const filePath = req.file.path
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
        console.error('❌ [uploadToCloudinary] Fichier non trouvé:', filePath)
        return res.status(400).json({
            success: false,
            message: 'Fichier temporaire non trouvé après upload'
        })
    }

    // Vérifier que le fichier n'est pas vide
    const stats = fs.statSync(filePath)
    if (stats.size === 0) {
        console.error('❌ [uploadToCloudinary] Fichier vide:', filePath)
        try {
            fs.unlinkSync(filePath)
        } catch (deleteError) {
            console.error('⚠️ [uploadToCloudinary] Erreur lors de la suppression du fichier vide:', deleteError)
        }
        return res.status(400).json({
            success: false,
            message: 'Le fichier téléchargé est vide'
        })
    }

    let resourceType = 'image' // Par défaut pour les images
    let transformations = {}

    // Si le fichier est une vidéo, on applique les transformations
    if (req.file.mimetype.startsWith('video/')) {
        resourceType = 'video'
        console.log('☁️ [uploadToCloudinary] Type: vidéo, application des transformations')
        transformations = {
            transformation: [
                { aspect_ratio: '9:16', crop: 'pad', background: 'black' },
                { width: 1080, height: 1920 }
            ]
        }
    } else {
        console.log('☁️ [uploadToCloudinary] Type: image')
    }

    // Upload vers Cloudinary
    console.log('☁️ [uploadToCloudinary] Upload vers Cloudinary en cours...')
    cloudinary.uploader.upload(
        filePath,
        {
            resource_type: resourceType,
            ...transformations
        },
        (error, result) => {
            // Supprimer le fichier local après upload (réussi ou échoué)
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath)
                    console.log('🗑️ [uploadToCloudinary] Fichier temporaire supprimé')
                } catch (deleteError) {
                    console.error('⚠️ [uploadToCloudinary] Erreur lors de la suppression du fichier temporaire:', deleteError)
                }
            }

            if (error) {
                console.error('❌ [uploadToCloudinary] Erreur Cloudinary:', error)
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'upload vers Cloudinary',
                    error: error.message
                })
            }

            console.log('✅ [uploadToCloudinary] Upload Cloudinary réussi:', result.secure_url)
            
            // Ajouter l'URL Cloudinary à la requête
            req.file.cloudinaryUrl = result.secure_url
            req.file.publicId = result.public_id
            req.file.resourceType = resourceType

            next()
        }
    )
}

/**
 * Fonction pour récupérer toutes les ressources Cloudinary
 */
const getAllCloudinaryData = async (req, res) => {
    try {
        const [images, videos] = await Promise.all([
            cloudinary.api.resources({
                resource_type: 'image',
                max_results: 500
            }),
            cloudinary.api.resources({
                resource_type: 'video',
                max_results: 500
            })
        ])

        res.json({
            success: true,
            data: {
                images: images.resources,
                videos: videos.resources,
                total: images.resources.length + videos.resources.length
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des ressources Cloudinary:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des ressources',
            error: error.message
        })
    }
}

/**
 * Fonction pour supprimer une ressource Cloudinary par URL
 */
const deleteResourceByUrl = async (req, res) => {
    try {
        const { url } = req.body

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL requise'
            })
        }

        // Extraire le public_id et le type de ressource depuis l'URL
        const parts = url.split('/')
        const resourceTypeIndex = parts.indexOf('upload') - 1
        const resourceType = parts[resourceTypeIndex] || 'image'
        const lastPart = parts[parts.length - 1]
        const publicId = lastPart.split('.')[0]

        // Supprimer la ressource
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        })

        if (result.result === 'ok') {
            res.json({
                success: true,
                message: 'Ressource supprimée avec succès',
                publicId
            })
        } else {
            res.status(404).json({
                success: false,
                message: 'Ressource non trouvée'
            })
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la ressource:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression',
            error: error.message
        })
    }
}

/**
 * Fonction pour supprimer toutes les vidéos Cloudinary
 */
const deleteAllVideos = async (req, res) => {
    try {
        const result = await cloudinary.api.resources({
            resource_type: 'video',
            max_results: 500
        })

        if (result.resources.length === 0) {
            return res.json({
                success: true,
                message: 'Aucune vidéo à supprimer',
                deleted: 0
            })
        }

        // Supprimer toutes les vidéos
        const deletionResults = await Promise.all(
            result.resources.map(video =>
                cloudinary.uploader.destroy(video.public_id, {
                    resource_type: 'video'
                })
            )
        )

        const deleted = deletionResults.filter(r => r.result === 'ok').length
        const failed = deletionResults.filter(r => r.result !== 'ok').length

        res.json({
            success: true,
            message: 'Suppression terminée',
            deleted,
            failed
        })
    } catch (error) {
        console.error('Erreur lors de la suppression des vidéos:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression des vidéos',
            error: error.message
        })
    }
}

/**
 * Fonction utilitaire pour supprimer une ressource Cloudinary par URL
 */
const deleteByUrl = async (url) => {
    try {
        if (!url) return null

        // Extraire le public_id et le type de ressource depuis l'URL
        const parts = url.split('/')
        const resourceTypeIndex = parts.indexOf('upload') - 1
        const resourceType = parts[resourceTypeIndex] || 'image'
        const lastPart = parts[parts.length - 1]
        const publicId = lastPart.split('.')[0]

        // Supprimer la ressource
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        })

        if (result.result === 'ok') {
            return { success: true, publicId }
        }
        return null
    } catch (error) {
        console.error('Error deleting resource by URL:', error)
        return null
    }
}

module.exports = {
    upload,
    uploadToCloudinary,
    getAllCloudinaryData,
    deleteResourceByUrl,
    deleteAllVideos,
    deleteByUrl
}

