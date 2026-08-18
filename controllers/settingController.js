const AppSetting = require('../models/AppSetting')
const { deleteByUrl } = require('../middlewares/upload')

/**
 * Reglages globaux de l'application, independants du salon courant.
 * Une valeur vide signifie "comportement par defaut cote app".
 */
const SETTING_DEFINITIONS = [
    {
        key: 'home_card_title',
        label: 'Titre de la carte d\'accueil',
        description: 'Titre affiche sur la carte de l\'ecran d\'accueil. Vide : le nom du salon courant est utilise.',
        type: 'text'
    },
    {
        key: 'home_card_image',
        label: 'Image de la carte d\'accueil',
        description: 'Image de fond de la carte de l\'ecran d\'accueil. Vide : l\'application utilise son image embarquee.',
        type: 'image'
    }
]

const SETTING_KEYS = SETTING_DEFINITIONS.map(d => d.key)

/**
 * Retourne toutes les valeurs sous forme { key: value }, les cles absentes
 * en base valant la chaine vide.
 */
const readSettings = async () => {
    const rows = await AppSetting.find({ key: { $in: SETTING_KEYS } }).lean()
    const byKey = new Map(rows.map(row => [row.key, row.value]))

    return SETTING_KEYS.reduce((acc, key) => {
        acc[key] = byKey.get(key) || ''
        return acc
    }, {})
}

const writeSetting = async (key, value) => {
    await AppSetting.updateOne(
        { key },
        { $set: { value: value || '' } },
        { upsert: true }
    )
}

/**
 * Reglages consommes par l'app mobile
 * GET /api/v2/app/settings
 */
const getPublicSettings = async (req, res) => {
    try {
        res.json({
            success: true,
            data: await readSettings()
        })
    } catch (error) {
        console.error('Error getting settings:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recuperation des reglages',
            error: error.message
        })
    }
}

/**
 * Reglages avec leurs metadonnees (admin)
 * GET /api/v2/admin/settings
 */
const getSettings = async (req, res) => {
    try {
        const values = await readSettings()

        res.json({
            success: true,
            data: {
                values,
                definitions: SETTING_DEFINITIONS
            }
        })
    } catch (error) {
        console.error('Error listing settings:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recuperation des reglages',
            error: error.message
        })
    }
}

/**
 * Mettre a jour un ou plusieurs reglages (admin)
 * PUT /api/v2/admin/settings
 * Body: { home_card_title: '...', home_card_image: '' }
 */
const updateSettings = async (req, res) => {
    try {
        const updates = Object.entries(req.body || {})
            .filter(([key]) => SETTING_KEYS.includes(key))

        if (!updates.length) {
            return res.status(400).json({
                success: false,
                message: 'Aucun reglage connu dans la requete'
            })
        }

        const current = await readSettings()

        for (const [key, value] of updates) {
            if (typeof value !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: `Le reglage "${key}" doit etre une chaine de caracteres`
                })
            }

            // Image remise a zero : on nettoie l'ancienne ressource Cloudinary
            if (key === 'home_card_image' && !value && current[key]) {
                deleteByUrl(current[key]).catch(() => {})
            }

            await writeSetting(key, value)
        }

        res.json({
            success: true,
            message: 'Reglages mis a jour',
            data: await readSettings()
        })
    } catch (error) {
        console.error('Error updating settings:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise a jour des reglages',
            error: error.message
        })
    }
}

/**
 * Televerser l'image de fond de la carte d'accueil (admin)
 * POST /api/v2/admin/settings/home-card-image
 * Champ de formulaire : "image"
 */
const updateHomeCardImage = async (req, res) => {
    try {
        if (!req.file?.cloudinaryUrl) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image recue'
            })
        }

        const current = await readSettings()
        const previousImage = current.home_card_image

        await writeSetting('home_card_image', req.file.cloudinaryUrl)

        if (previousImage && previousImage !== req.file.cloudinaryUrl) {
            deleteByUrl(previousImage).catch(() => {})
        }

        res.json({
            success: true,
            message: 'Image mise a jour',
            data: await readSettings()
        })
    } catch (error) {
        console.error('Error updating home card image:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise a jour de l\'image',
            error: error.message
        })
    }
}

module.exports = {
    SETTING_DEFINITIONS,
    readSettings,
    getPublicSettings,
    getSettings,
    updateSettings,
    updateHomeCardImage
}
