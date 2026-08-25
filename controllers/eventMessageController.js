const mongoose = require('mongoose')
const EventMessage = require('../models/EventMessage')
const Event = require('../models/Event')

// Champs d'auteur exposés publiquement. Centralisés pour que lecture et
// écriture renvoient exactement la même forme au client.
const EXPOSANT_FIELDS = 'nom profilePic email'
const INVITE_FIELDS = 'nom email'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50
const MAX_CONTENT_LENGTH = 1000

const isProduction = () => process.env.NODE_ENV === 'production'

/**
 * Réponse d'erreur. Le détail technique n'est renvoyé qu'hors production :
 * un message d'exception Mongo expose la structure interne de la base.
 */
const fail = (res, status, message, error) => {
    return res.status(status).json({
        success: false,
        message,
        ...(error && !isProduction() ? { error: error.message } : {})
    })
}

/**
 * Valide et normalise le contenu d'un message.
 * @returns {{ ok: true, content: string } | { ok: false, message: string }}
 */
const normalizeContent = (raw) => {
    if (typeof raw !== 'string' || !raw) {
        return { ok: false, message: 'Contenu requis' }
    }
    const content = raw.trim()
    if (content.length === 0) {
        return { ok: false, message: 'Le contenu du message ne peut pas être vide' }
    }
    if (content.length > MAX_CONTENT_LENGTH) {
        return { ok: false, message: `Le contenu du message ne doit pas dépasser ${MAX_CONTENT_LENGTH} caractères` }
    }
    return { ok: true, content }
}

/**
 * Identifie l'auteur de la requête et vérifie qu'il est bien propriétaire du
 * message passé en argument.
 */
const isMessageOwner = (req, message) => {
    if (req.userType === 'exposant' && req.exposantId && message.exposantId) {
        return message.exposantId.toString() === req.exposantId.toString()
    }
    if (req.userType === 'invite' && req.inviteId && message.inviteId) {
        return message.inviteId.toString() === req.inviteId.toString()
    }
    return false
}

/**
 * Créer un message pour un événement
 * POST /api/v2/app/event-messages
 * Requiert authentification (exposant ou invité connecté)
 */
const createEventMessage = async (req, res) => {
    try {
        const { eventId, content } = req.body

        if (!eventId) {
            return fail(res, 400, 'Event ID requis')
        }

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return fail(res, 400, 'ID d\'événement invalide')
        }

        const normalized = normalizeContent(content)
        if (!normalized.ok) {
            return fail(res, 400, normalized.message)
        }

        // Vérification d'existence conservée sur l'écriture : elle empêche de
        // créer des messages orphelins, et ne coûte qu'une requête par message
        // envoyé (contrairement à la lecture, appelée en boucle).
        const eventExists = await Event.exists({ _id: eventId })

        if (!eventExists) {
            return fail(res, 404, 'Événement non trouvé')
        }

        // Déterminer l'auteur selon le type d'utilisateur
        const messageData = {
            eventId,
            content: normalized.content,
            statut: 1
        }

        if (req.userType === 'exposant' && req.exposantId) {
            messageData.exposantId = req.exposantId
        } else if (req.userType === 'invite' && req.inviteId) {
            messageData.inviteId = req.inviteId
        } else {
            return fail(res, 400, 'Type d\'utilisateur non reconnu')
        }

        const newMessage = await EventMessage.create(messageData)

        // Populate pour retourner les données complètes
        if (newMessage.exposantId) {
            await newMessage.populate('exposantId', EXPOSANT_FIELDS)
        } else if (newMessage.inviteId) {
            await newMessage.populate('inviteId', INVITE_FIELDS)
        }

        res.status(201).json({
            success: true,
            message: 'Message créé avec succès',
            data: newMessage
        })
    } catch (error) {
        console.error('Erreur lors de la création du message:', error)
        fail(res, 500, 'Erreur lors de la création du message', error)
    }
}

/**
 * Récupérer les messages d'un événement.
 * GET /api/v2/app/event-messages/:eventId
 * Route publique (lecture seule).
 *
 * Trois modes, dans l'ordre de priorité :
 *
 *  - `?since=<ISO>`  : mode delta, utilisé par le rafraîchissement automatique.
 *                      Ne renvoie que les messages postés après cette date, soit
 *                      un tableau vide dans l'immense majorité des appels.
 *  - `?before=<ISO>` : pagination par curseur, pour remonter le fil. Immunisée
 *                      contre le décalage provoqué par l'arrivée de nouveaux
 *                      messages, contrairement à `skip`.
 *  - `?page=<n>`     : pagination historique, conservée pour les versions de
 *                      l'app déjà déployées.
 *
 * Dans tous les cas les messages sont renvoyés du plus récent au plus ancien,
 * et `pagination.hasMore` est déduit d'un document surnuméraire plutôt que
 * d'un `countDocuments`, qui parcourait toute la collection à chaque appel.
 */
const getEventMessages = async (req, res) => {
    try {
        const { eventId } = req.params

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return fail(res, 400, 'ID d\'événement invalide')
        }

        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || DEFAULT_LIMIT, 1),
            MAX_LIMIT
        )

        const filter = { eventId, statut: 1 }
        const { since, before } = req.query
        let skip = 0
        let page = 1
        // En mode delta on prend les PLUS ANCIENS des nouveaux messages : si
        // plus de `limit` messages sont arrivés depuis le dernier appel, le
        // client avance son curseur au fur et à mesure sans jamais sauter de
        // message. En tri décroissant, le milieu du fil serait perdu.
        let ascending = false

        if (since) {
            const sinceDate = new Date(since)
            if (Number.isNaN(sinceDate.getTime())) {
                return fail(res, 400, 'Paramètre `since` invalide (date ISO attendue)')
            }
            filter.createdAt = { $gt: sinceDate }
            ascending = true
        } else if (before) {
            const beforeDate = new Date(before)
            if (Number.isNaN(beforeDate.getTime())) {
                return fail(res, 400, 'Paramètre `before` invalide (date ISO attendue)')
            }
            filter.createdAt = { $lt: beforeDate }
        } else {
            page = Math.max(parseInt(req.query.page) || 1, 1)
            skip = (page - 1) * limit
        }

        // On demande un document de plus que la limite : sa présence indique
        // qu'il reste des messages à charger.
        const docs = await EventMessage.find(filter)
            .sort({ createdAt: ascending ? 1 : -1 })
            .skip(skip)
            .limit(limit + 1)
            .populate('exposantId', EXPOSANT_FIELDS)
            .populate('inviteId', INVITE_FIELDS)
            .lean()

        const hasMore = docs.length > limit
        const messages = hasMore ? docs.slice(0, limit) : docs

        // Le client attend toujours le plus récent en premier.
        if (ascending) messages.reverse()

        res.json({
            success: true,
            data: {
                messages,
                pagination: {
                    page,
                    limit,
                    count: messages.length,
                    hasMore
                }
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error)
        fail(res, 500, 'Erreur lors de la récupération des messages', error)
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return fail(res, 400, 'ID de message invalide')
        }

        const normalized = normalizeContent(req.body.content)
        if (!normalized.ok) {
            return fail(res, 400, normalized.message)
        }

        const message = await EventMessage.findById(id)

        if (!message || message.statut !== 1) {
            return fail(res, 404, 'Message non trouvé')
        }

        if (!isMessageOwner(req, message)) {
            return fail(res, 403, 'Vous ne pouvez modifier que vos propres messages')
        }

        message.content = normalized.content
        await message.save()

        // Populate pour retourner les données complètes
        if (message.exposantId) {
            await message.populate('exposantId', EXPOSANT_FIELDS)
        } else if (message.inviteId) {
            await message.populate('inviteId', INVITE_FIELDS)
        }

        res.json({
            success: true,
            message: 'Message mis à jour avec succès',
            data: message
        })
    } catch (error) {
        console.error('Erreur lors de la mise à jour du message:', error)
        fail(res, 500, 'Erreur lors de la mise à jour du message', error)
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return fail(res, 400, 'ID de message invalide')
        }

        const message = await EventMessage.findById(id)

        if (!message || message.statut !== 1) {
            return fail(res, 404, 'Message non trouvé')
        }

        if (!isMessageOwner(req, message)) {
            return fail(res, 403, 'Vous ne pouvez supprimer que vos propres messages')
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
        fail(res, 500, 'Erreur lors de la suppression du message', error)
    }
}

module.exports = {
    createEventMessage,
    getEventMessages,
    updateEventMessage,
    deleteEventMessage
}
