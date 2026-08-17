const Feature = require('../models/Feature')

/**
 * Catalogue des fonctionnalités pilotables depuis l'espace admin.
 * Ajouter une entrée ici suffit : elle est créée en base au premier appel.
 */
const FEATURE_DEFINITIONS = [
    {
        key: 'home_chatbot',
        label: 'Chatbot IA sur l\'accueil',
        description: 'Affiche le bouton flottant du chatbot IA sur l\'écran d\'accueil de l\'application mobile.',
        icon: 'fa-robot',
        defaultEnabled: false
    },
    {
        key: 'interactive_plan',
        label: 'Plan interactif',
        description: 'Affiche le plan interactif du salon : raccourci sur l\'accueil et entrée du menu dans l\'écran Plus.',
        icon: 'fa-map-location-dot',
        defaultEnabled: true
    },
    {
        key: 'home_live_tab',
        label: 'Onglet Live sur l\'accueil',
        description: 'Affiche l\'onglet "Live" dans la barre d\'onglets de l\'écran d\'accueil de l\'application mobile.',
        icon: 'fa-tower-broadcast',
        defaultEnabled: true
    },
    {
        key: 'salon_switcher',
        label: 'Choix du salon',
        description: 'Affiche l\'entrée "Choisir un salon" dans l\'écran Plus. Désactivé, l\'utilisateur reste sur le salon actif sélectionné au premier lancement.',
        icon: 'fa-store',
        defaultEnabled: true
    }
]

/**
 * Crée en base les fonctionnalités du catalogue qui n'existent pas encore,
 * puis retourne la liste complète (ordre du catalogue).
 */
const ensureFeatures = async () => {
    await Promise.all(FEATURE_DEFINITIONS.map(definition =>
        Feature.updateOne(
            { key: definition.key },
            {
                $setOnInsert: {
                    key: definition.key,
                    label: definition.label,
                    description: definition.description,
                    enabled: definition.defaultEnabled
                }
            },
            { upsert: true }
        )
    ))

    const features = await Feature.find({
        key: { $in: FEATURE_DEFINITIONS.map(d => d.key) }
    }).lean()

    const byKey = new Map(features.map(feature => [feature.key, feature]))

    return FEATURE_DEFINITIONS
        .map(definition => {
            const feature = byKey.get(definition.key)
            if (!feature) return null
            return {
                ...feature,
                // Le libellé/description font foi côté code, pas côté base
                label: definition.label,
                description: definition.description,
                icon: definition.icon
            }
        })
        .filter(Boolean)
}

/**
 * Récupérer l'état des fonctionnalités (public, consommé par l'app mobile)
 * GET /api/v2/app/features
 */
const getPublicFeatures = async (req, res) => {
    try {
        const features = await ensureFeatures()

        // Format compact : { home_chatbot: true, ... }
        const data = features.reduce((acc, feature) => {
            acc[feature.key] = feature.enabled
            return acc
        }, {})

        res.json({
            success: true,
            data
        })
    } catch (error) {
        console.error('Error getting features:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des fonctionnalités',
            error: error.message
        })
    }
}

/**
 * Lister les fonctionnalités avec leurs métadonnées (admin)
 * GET /api/v2/admin/features
 */
const getFeatures = async (req, res) => {
    try {
        const features = await ensureFeatures()

        res.json({
            success: true,
            count: features.length,
            data: features
        })
    } catch (error) {
        console.error('Error listing features:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des fonctionnalités',
            error: error.message
        })
    }
}

/**
 * Activer / désactiver une fonctionnalité (admin)
 * PATCH /api/v2/admin/features/:key
 * Body: { enabled: Boolean }
 */
const updateFeature = async (req, res) => {
    try {
        const { key } = req.params
        const { enabled } = req.body

        const definition = FEATURE_DEFINITIONS.find(d => d.key === key)
        if (!definition) {
            return res.status(404).json({
                success: false,
                message: 'Fonctionnalité inconnue'
            })
        }

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Le champ "enabled" doit être un booléen'
            })
        }

        const feature = await Feature.findOneAndUpdate(
            { key },
            {
                $set: { enabled },
                $setOnInsert: {
                    key: definition.key,
                    label: definition.label,
                    description: definition.description
                }
            },
            { new: true, upsert: true }
        ).lean()

        res.json({
            success: true,
            message: `Fonctionnalité ${enabled ? 'activée' : 'désactivée'}`,
            data: {
                ...feature,
                label: definition.label,
                description: definition.description,
                icon: definition.icon
            }
        })
    } catch (error) {
        console.error('Error updating feature:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la fonctionnalité',
            error: error.message
        })
    }
}

module.exports = {
    FEATURE_DEFINITIONS,
    ensureFeatures,
    getPublicFeatures,
    getFeatures,
    updateFeature
}
