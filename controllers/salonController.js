const Salon = require('../models/Salon')

/**
 * Récupérer tous les salons
 * GET /api/v2/salons
 */
const getAllSalons = async (req, res) => {
    try {
        const salons = await Salon.find({ statut: 1 }).sort({ createdAt: -1 })

        res.json({
            success: true,
            count: salons.length,
            data: salons
        })
    } catch (error) {
        console.error('Error getting salons:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des salons',
            error: error.message
        })
    }
}

/**
 * Récupérer un salon par ID
 * GET /api/v2/salons/:id
 */
const getSalonById = async (req, res) => {
    try {
        const salon = await Salon.findById(req.params.id)

        if (!salon) {
            return res.status(404).json({
                success: false,
                message: 'Salon non trouvé'
            })
        }

        res.json({
            success: true,
            data: salon
        })
    } catch (error) {
        console.error('Error getting salon:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du salon',
            error: error.message
        })
    }
}

/**
 * Récupérer le salon actif
 * GET /api/v2/salons/active
 */
const getActiveSalon = async (req, res) => {
    try {
        const salon = await Salon.findOne({ isActive: true, statut: 1 })

        if (!salon) {
            return res.status(404).json({
                success: false,
                message: 'Aucun salon actif trouvé'
            })
        }

        res.json({
            success: true,
            data: salon
        })
    } catch (error) {
        console.error('Error getting active salon:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du salon actif',
            error: error.message
        })
    }
}

/**
 * Définir le salon actif
 * POST /api/v2/salons/set-active
 * Requiert authentification admin
 */
const setActiveSalon = async (req, res) => {
    try {
        const { salonId } = req.body

        if (!salonId) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis'
            })
        }

        // Vérifier que le salon existe
        const salon = await Salon.findById(salonId)

        if (!salon) {
            return res.status(404).json({
                success: false,
                message: 'Salon non trouvé'
            })
        }

        // Désactiver tous les autres salons
        await Salon.updateMany({}, { $set: { isActive: false } })

        // Activer le salon sélectionné
        salon.isActive = true
        await salon.save()

        // TODO: Envoyer une notification push à tous les utilisateurs
        // const { notifyAllUsers } = require('../services/notificationService')
        // await notifyAllUsers({
        //     title: 'Changement de Salon',
        //     body: `Le ${salon.nom} est maintenant actif.`,
        //     data: {
        //         action: 'switch_salon',
        //         deepLink: 'myapp://switch-salon',
        //         salonId: salon._id.toString()
        //     }
        // })

        res.json({
            success: true,
            message: 'Salon activé avec succès',
            data: salon
        })
    } catch (error) {
        console.error('Error setting active salon:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'activation du salon',
            error: error.message
        })
    }
}

/**
 * Créer un nouveau salon
 * POST /api/v2/salons
 * Requiert authentification admin
 */
const createSalon = async (req, res) => {
    try {
        const { nom, description } = req.body

        if (!nom) {
            return res.status(400).json({
                success: false,
                message: 'Le nom du salon est requis'
            })
        }

        // Vérifier si un salon avec ce nom existe déjà
        const existingSalon = await Salon.findOne({ nom })

        if (existingSalon) {
            return res.status(400).json({
                success: false,
                message: 'Un salon avec ce nom existe déjà'
            })
        }

        const salon = await Salon.create({
            nom,
            description: description || '',
            isActive: false,
            statut: 1
        })

        res.status(201).json({
            success: true,
            message: 'Salon créé avec succès',
            data: salon
        })
    } catch (error) {
        console.error('Error creating salon:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du salon',
            error: error.message
        })
    }
}

/**
 * Mettre à jour un salon
 * PUT /api/v2/salons/:id
 * Requiert authentification admin
 */
const updateSalon = async (req, res) => {
    try {
        const { nom, description, isActive, statut } = req.body

        const salon = await Salon.findById(req.params.id)

        if (!salon) {
            return res.status(404).json({
                success: false,
                message: 'Salon non trouvé'
            })
        }

        // Mettre à jour les champs fournis
        if (nom !== undefined) salon.nom = nom
        if (description !== undefined) salon.description = description
        if (isActive !== undefined) salon.isActive = isActive
        if (statut !== undefined) salon.statut = statut

        await salon.save()

        res.json({
            success: true,
            message: 'Salon mis à jour avec succès',
            data: salon
        })
    } catch (error) {
        console.error('Error updating salon:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du salon',
            error: error.message
        })
    }
}

/**
 * Supprimer un salon (soft delete)
 * DELETE /api/v2/salons/:id
 * Requiert authentification admin
 */
const deleteSalon = async (req, res) => {
    try {
        const salon = await Salon.findById(req.params.id)

        if (!salon) {
            return res.status(404).json({
                success: false,
                message: 'Salon non trouvé'
            })
        }

        // Soft delete : mettre statut à 0
        salon.statut = 0
        salon.isActive = false
        await salon.save()

        res.json({
            success: true,
            message: 'Salon supprimé avec succès'
        })
    } catch (error) {
        console.error('Error deleting salon:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du salon',
            error: error.message
        })
    }
}

module.exports = {
    getAllSalons,
    getSalonById,
    getActiveSalon,
    setActiveSalon,
    createSalon,
    updateSalon,
    deleteSalon
}

