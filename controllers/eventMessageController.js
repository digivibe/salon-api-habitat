const EventMessage = require('../models/EventMessage')
const Event = require('../models/Event')

/**
 * Créer un message pour un événement
 * POST /api/v2/app/event-messages
 * Requiert authentification (exposant ou invité connecté)
 */
const createEventMessage = async (req, res) => {
    try {
        const { eventId, content } = req.body

        if (!eventId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Event ID et contenu requis'
            })
        }

        if (content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du message ne peut pas être vide'
            })
        }

        if (content.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du message ne doit pas dépasser 1000 caractères'
            })
        }

        // Vérifier que l'événement existe
        const event = await Event.findById(eventId)

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            })
        }

        // Déterminer l'auteur selon le type d'utilisateur
        const messageData = {
            eventId: eventId,
            content: content.trim(),
            statut: 1
        }

        if (req.userType === 'exposant' && req.exposantId) {
            messageData.exposantId = req.exposantId
        } else if (req.userType === 'invite' && req.inviteId) {
            messageData.inviteId = req.inviteId
        } else {
            return res.status(400).json({
                success: false,
                message: 'Type d\'utilisateur non reconnu'
            })
        }

        // Créer le message
        const newMessage = await EventMessage.create(messageData)

        // Populate pour retourner les données complètes
        if (newMessage.exposantId) {
            await newMessage.populate('exposantId', 'nom profilePic email')
        } else if (newMessage.inviteId) {
            await newMessage.populate('inviteId', 'nom email')
        }

        res.status(201).json({
            success: true,
            message: 'Message créé avec succès',
            data: newMessage
        })
    } catch (error) {
        console.error('Erreur lors de la création du message:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du message',
            error: error.message
        })
    }
}

/**
 * Récupérer les messages d'un événement avec pagination
 * GET /api/v2/app/event-messages/:eventId
 * Route publique (lecture seule)
 */
const getEventMessages = async (req, res) => {
    try {
        const { eventId } = req.params
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const skip = (page - 1) * limit

        // Vérifier que l'événement existe
        const event = await Event.findById(eventId)

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            })
        }

        // Récupérer les messages (plus anciens en premier pour la pagination)
        const messages = await EventMessage.find({
            eventId: eventId,
            statut: 1
        })
            .sort({ createdAt: -1 }) // Plus récents en premier
            .skip(skip)
            .limit(limit)
            .populate('exposantId', 'nom profilePic email')
            .populate('inviteId', 'nom email')

        // Compter le total de messages
        const total = await EventMessage.countDocuments({
            eventId: eventId,
            statut: 1
        })

        res.json({
            success: true,
            data: {
                messages: messages,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit),
                    hasMore: skip + messages.length < total
                }
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages',
            error: error.message
        })
    }
}

/**
 * Mettre à jour un message
 * PUT /api/v2/app/event-messages/:id
 * Requiert authentification (exposant ou invité connecté, propriétaire uniquement)
 */
const updateEventMessage = async (req, res) => {
    try {
        const { id } = req.params
        const { content } = req.body

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Contenu requis'
            })
        }

        if (content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du message ne peut pas être vide'
            })
        }

        if (content.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu du message ne doit pas dépasser 1000 caractères'
            })
        }

        // Vérifier que le message existe et appartient à l'utilisateur
        const message = await EventMessage.findById(id)

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            })
        }

        // Vérifier la propriété selon le type d'utilisateur
        let isOwner = false
        if (req.userType === 'exposant' && req.exposantId && message.exposantId) {
            isOwner = message.exposantId.toString() === req.exposantId.toString()
        } else if (req.userType === 'invite' && req.inviteId && message.inviteId) {
            isOwner = message.inviteId.toString() === req.inviteId.toString()
        }

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez modifier que vos propres messages'
            })
        }

        // Mettre à jour le message
        message.content = content.trim()
        await message.save()

        // Populate pour retourner les données complètes
        if (message.exposantId) {
            await message.populate('exposantId', 'nom profilePic email')
        } else if (message.inviteId) {
            await message.populate('inviteId', 'nom email')
        }

        res.json({
            success: true,
            message: 'Message mis à jour avec succès',
            data: message
        })
    } catch (error) {
        console.error('Erreur lors de la mise à jour du message:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du message',
            error: error.message
        })
    }
}

/**
 * Supprimer un message
 * DELETE /api/v2/app/event-messages/:id
 * Requiert authentification (exposant ou invité connecté, propriétaire uniquement)
 */
const deleteEventMessage = async (req, res) => {
    try {
        const { id } = req.params

        // Vérifier que le message existe et appartient à l'utilisateur
        const message = await EventMessage.findById(id)

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            })
        }

        // Vérifier la propriété selon le type d'utilisateur
        let isOwner = false
        if (req.userType === 'exposant' && req.exposantId && message.exposantId) {
            isOwner = message.exposantId.toString() === req.exposantId.toString()
        } else if (req.userType === 'invite' && req.inviteId && message.inviteId) {
            isOwner = message.inviteId.toString() === req.inviteId.toString()
        }

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez supprimer que vos propres messages'
            })
        }

        // Soft delete (changer le statut)
        message.statut = 0
        await message.save()

        res.json({
            success: true,
            message: 'Message supprimé avec succès'
        })
    } catch (error) {
        console.error('Erreur lors de la suppression du message:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du message',
            error: error.message
        })
    }
}

module.exports = {
    createEventMessage,
    getEventMessages,
    updateEventMessage,
    deleteEventMessage
}

