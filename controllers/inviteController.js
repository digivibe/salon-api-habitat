const Invite = require('../models/Invite')

/**
 * Récupérer tous les invités avec pagination et filtres
 * GET /api/v2/admin/invites?page=1&limit=20&search=...
 * Requiert authentification admin
 */
const getAllInvites = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            statut
        } = req.query

        // Construire le filtre
        const filter = {}

        if (search) {
            filter.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }

        if (statut !== undefined) {
            filter.statut = parseInt(statut)
        }

        // Calculer la pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Récupérer les invités
        const invites = await Invite.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean()

        // Compter le total
        const total = await Invite.countDocuments(filter)

        res.json({
            success: true,
            data: invites,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        })
    } catch (error) {
        console.error('Error getting invites:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des invités',
            error: error.message
        })
    }
}

/**
 * Récupérer un invité par ID
 * GET /api/v2/admin/invites/:id
 * Requiert authentification admin
 */
const getInviteById = async (req, res) => {
    try {
        const { id } = req.params

        const invite = await Invite.findById(id)
            .select('-password')
            .lean()

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invité non trouvé'
            })
        }

        res.json({
            success: true,
            data: invite
        })
    } catch (error) {
        console.error('Error getting invite:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'invité',
            error: error.message
        })
    }
}

/**
 * Créer un nouvel invité
 * POST /api/v2/admin/invites
 * Requiert authentification admin
 */
const createInvite = async (req, res) => {
    try {
        const {
            nom,
            email,
            password,
            statut = 1
        } = req.body

        // Validation des champs requis
        if (!nom || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants (nom, email, password)'
            })
        }

        // Vérifier si l'email existe déjà
        const existingEmail = await Invite.findOne({ email: email.trim().toLowerCase() })
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            })
        }

        // Créer le nouvel invité
        const newInvite = await Invite.create({
            nom: nom.trim(),
            email: email.trim().toLowerCase(),
            password,
            statut
        })

        const savedInvite = await Invite.findById(newInvite._id)
            .select('-password')

        res.status(201).json({
            success: true,
            message: 'Invité créé avec succès',
            data: savedInvite
        })
    } catch (error) {
        console.error('Error creating invite:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'invité',
            error: error.message
        })
    }
}

/**
 * Mettre à jour un invité
 * PUT /api/v2/admin/invites/:id
 * Requiert authentification admin
 */
const updateInvite = async (req, res) => {
    try {
        const { id } = req.params
        const {
            nom,
            email,
            password,
            statut
        } = req.body

        const invite = await Invite.findById(id)

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invité non trouvé'
            })
        }

        // Vérifier si l'email est changé et s'il existe déjà
        if (email && email.trim().toLowerCase() !== invite.email) {
            const existingEmail = await Invite.findOne({ email: email.trim().toLowerCase() })
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                })
            }
        }

        // Mettre à jour les champs fournis
        if (nom !== undefined) invite.nom = nom.trim()
        if (email !== undefined) invite.email = email.trim().toLowerCase()
        if (password !== undefined) invite.password = password // Le hash sera fait automatiquement par le pre-save
        if (statut !== undefined) invite.statut = statut

        await invite.save()

        const updatedInvite = await Invite.findById(id)
            .select('-password')

        res.json({
            success: true,
            message: 'Invité mis à jour avec succès',
            data: updatedInvite
        })
    } catch (error) {
        console.error('Error updating invite:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'invité',
            error: error.message
        })
    }
}

/**
 * Supprimer un invité (soft delete par défaut, hard delete si hard=true)
 * DELETE /api/v2/admin/invites/:id?hard=true
 * Requiert authentification admin
 */
const deleteInvite = async (req, res) => {
    try {
        const { id } = req.params
        const { hard } = req.query

        const invite = await Invite.findById(id)

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invité non trouvé'
            })
        }

        // Hard delete : suppression complète
        if (hard === 'true') {
            await Invite.findByIdAndDelete(id)
            return res.json({
                success: true,
                message: 'Invité supprimé définitivement'
            })
        }

        // Soft delete : mettre statut à 0
        invite.statut = 0
        invite.isActive = false
        await invite.save()

        res.json({
            success: true,
            message: 'Invité désactivé avec succès'
        })
    } catch (error) {
        console.error('Error deleting invite:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'invité',
            error: error.message
        })
    }
}

/**
 * Mettre à jour le statut d'un invité
 * PATCH /api/v2/admin/invites/:id/status
 * Requiert authentification admin
 */
const updateInviteStatus = async (req, res) => {
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

        const invite = await Invite.findByIdAndUpdate(
            id,
            { 
                statut,
                isActive: statut === 1
            },
            { new: true }
        )
            .select('-password')

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invité non trouvé'
            })
        }

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            data: invite
        })
    } catch (error) {
        console.error('Error updating invite status:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut',
            error: error.message
        })
    }
}

module.exports = {
    getAllInvites,
    getInviteById,
    createInvite,
    updateInvite,
    deleteInvite,
    updateInviteStatus
}









