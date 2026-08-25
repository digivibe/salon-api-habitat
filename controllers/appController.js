const mongoose = require('mongoose')
const Categorie = require('../models/Categorie')
const Event = require('../models/Event')
const EventMessage = require('../models/EventMessage')
const Exposant = require('../models/Exposant')
const ExposantVideo = require('../models/ExposantVideo')
const ExposantBondeal = require('../models/ExposantBondeal')
const Rdv = require('../models/Rdv')
const nodemailer = require('nodemailer')

/**
 * Récupérer la version de l'API
 * GET /api/v2/app/version
 */
const getVersion = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                versionCode: parseInt(process.env.VERSION_CODE) || 1,
                version: '2.0.0',
                api: 'v2',
                minAppVersion: process.env.MIN_APP_VERSION || null,
                storeUrls: {
                    ios: process.env.STORE_URL_IOS || null,
                    android: process.env.STORE_URL_ANDROID || null
                }
            }
        })
    } catch (error) {
        console.error('Error getting version:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la version',
            error: error.message
        })
    }
}

/**
 * Récupérer toutes les catégories d'un salon
 * GET /api/v2/app/categories?salon=:salonId
 */
const getAllCategories = async (req, res) => {
    try {
        const { salon } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        const categories = await Categorie.find({ salon, statut: 1 })
            .populate('salon', 'nom slug description statut')
            .sort({ label: 1 })

        res.json({
            success: true,
            count: categories.length,
            data: categories
        })
    } catch (error) {
        console.error('Error getting categories:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des catégories',
            error: error.message
        })
    }
}

/**
 * Créer une nouvelle catégorie
 * POST /api/v2/app/categories
 * Requiert authentification admin
 */
const createCategory = async (req, res) => {
    try {
        const { salon, color, borderColor, label } = req.body

        // Validation
        if (!salon || !color || !borderColor || !label) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis (salon, color, borderColor, label)'
            })
        }

        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return res.status(400).json({
                success: false,
                message: 'Format de couleur invalide (format hexadécimal requis: #RRGGBB)'
            })
        }

        if (!/^#[0-9A-Fa-f]{6}$/.test(borderColor)) {
            return res.status(400).json({
                success: false,
                message: 'Format de couleur de bordure invalide (format hexadécimal requis: #RRGGBB)'
            })
        }

        if (label.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Le label ne doit pas dépasser 100 caractères'
            })
        }

        // Vérifier si la catégorie existe déjà pour ce salon
        const existingCategory = await Categorie.findOne({ salon, label })

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Une catégorie avec ce label existe déjà pour ce salon'
            })
        }

        const category = await Categorie.create({
            salon,
            color,
            borderColor,
            label,
            statut: 1
        })

        res.status(201).json({
            success: true,
            message: 'Catégorie créée avec succès',
            data: category
        })
    } catch (error) {
        console.error('Error creating category:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la catégorie',
            error: error.message
        })
    }
}

/**
 * Champs d'un événement exposés à l'application.
 */
const EVENT_PUBLIC_FIELDS = 'titre description fullEventDate eventDate createdAt'

/**
 * Réponse d'erreur. Le détail technique n'est renvoyé qu'hors production.
 */
const failEvent = (res, status, message, error) => {
    return res.status(status).json({
        success: false,
        message,
        ...(error && process.env.NODE_ENV !== 'production' ? { error: error.message } : {})
    })
}

/**
 * Fuseau de référence du salon. `toISOString()` renvoie une date UTC : un
 * événement du 13 septembre à 00h30 à Paris (soit 22h30 UTC le 12) se voyait
 * attribuer le 12 septembre comme jour. On formate donc explicitement dans le
 * fuseau du salon. Le locale `sv-SE` produit nativement du YYYY-MM-DD.
 */
const SALON_TIMEZONE = process.env.SALON_TIMEZONE || 'Europe/Paris'

const dayFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: SALON_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
})

const toLocalDayString = (date) => dayFormatter.format(date)

/**
 * Récupérer tous les événements (indépendants des salons)
 * GET /api/v2/app/events
 * @param {string} [req.query.eventDate] - Filtre sur un jour précis (YYYY-MM-DD)
 * @param {string} [req.query.from] - Ne renvoie que les événements à partir de cette date (ISO)
 */
const getAllEvents = async (req, res) => {
    try {
        const filter = { statut: 1 }

        // Filtre par jour : documenté côté app depuis le départ mais jamais
        // implémenté ici, ce qui obligeait le client à tout télécharger.
        const { eventDate, from } = req.query

        if (eventDate) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
                return failEvent(res, 400, 'Format de date invalide (format requis: YYYY-MM-DD)')
            }
            filter.eventDate = eventDate
        } else if (from) {
            const fromDate = new Date(from)
            if (Number.isNaN(fromDate.getTime())) {
                return failEvent(res, 400, 'Paramètre `from` invalide (date ISO attendue)')
            }
            filter.fullEventDate = { $gte: fromDate }
        }

        const events = await Event.find(filter)
            .sort({ fullEventDate: -1 })
            .select(EVENT_PUBLIC_FIELDS)
            .lean()

        res.json({
            success: true,
            count: events.length,
            data: events
        })
    } catch (error) {
        console.error('Error getting events:', error)
        failEvent(res, 500, 'Erreur lors de la récupération des événements', error)
    }
}

/**
 * Récupérer un événement par ID
 * GET /api/v2/app/events/:id
 */
const getEventById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return failEvent(res, 400, "ID d'événement invalide")
        }

        // Le statut fait partie du filtre : un événement désactivé est traité
        // comme inexistant, sans exposer son existence au client.
        const event = await Event.findOne({ _id: id, statut: 1 })
            .select(EVENT_PUBLIC_FIELDS)
            .lean()

        if (!event) {
            return failEvent(res, 404, 'Événement non trouvé')
        }

        res.json({
            success: true,
            data: event
        })
    } catch (error) {
        console.error('Error getting event by ID:', error)
        failEvent(res, 500, "Erreur lors de la récupération de l'événement", error)
    }
}

/**
 * Créer un nouvel événement
 * POST /api/v2/app/events
 * Requiert authentification admin
 */
const createEvent = async (req, res) => {
    try {
        const { eventDate, titre, description, fullEventDate } = req.body

        // Validation
        if (!titre || !description) {
            return failEvent(res, 400, 'Tous les champs sont requis (titre, description)')
        }

        if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
            return failEvent(res, 400, 'Format de date invalide (format requis: YYYY-MM-DD)')
        }

        if (titre.length > 100) {
            return failEvent(res, 400, 'Le titre ne doit pas dépasser 100 caractères')
        }

        if (description.length > 500) {
            return failEvent(res, 400, 'La description ne doit pas dépasser 500 caractères')
        }

        // Convertir la date en objet Date
        let eventDateObj
        if (fullEventDate) {
            eventDateObj = new Date(fullEventDate)
        } else if (eventDate) {
            eventDateObj = new Date(eventDate)
        } else {
            return failEvent(res, 400, 'Une date est requise (eventDate ou fullEventDate)')
        }

        if (isNaN(eventDateObj.getTime())) {
            return failEvent(res, 400, 'Date invalide')
        }

        const event = await Event.create({
            eventDate: eventDate || toLocalDayString(eventDateObj),
            fullEventDate: eventDateObj,
            titre,
            description,
            statut: 1
        })

        res.status(201).json({
            success: true,
            message: 'Événement créé avec succès',
            data: event
        })
    } catch (error) {
        console.error('Error creating event:', error)
        failEvent(res, 500, "Erreur lors de la création de l'événement", error)
    }
}

/**
 * Mettre à jour un événement
 * PUT /api/v2/app/events/:id
 * Requiert authentification admin
 */
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params
        const { eventDate, titre, description, fullEventDate, statut } = req.body

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return failEvent(res, 400, "ID d'événement invalide")
        }

        const event = await Event.findById(id)

        if (!event) {
            return failEvent(res, 404, 'Événement non trouvé')
        }

        // Validation
        if (titre && titre.length > 100) {
            return failEvent(res, 400, 'Le titre ne doit pas dépasser 100 caractères')
        }

        if (description && description.length > 500) {
            return failEvent(res, 400, 'La description ne doit pas dépasser 500 caractères')
        }

        if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
            return failEvent(res, 400, 'Format de date invalide (format requis: YYYY-MM-DD)')
        }

        // Mise à jour des champs
        if (titre !== undefined) event.titre = titre
        if (description !== undefined) event.description = description
        if (statut !== undefined) event.statut = statut

        // Gestion des dates
        if (fullEventDate) {
            const dateObj = new Date(fullEventDate)
            if (isNaN(dateObj.getTime())) {
                return failEvent(res, 400, 'Date invalide')
            }
            event.fullEventDate = dateObj
            event.eventDate = toLocalDayString(dateObj)
        } else if (eventDate) {
            const dateObj = new Date(eventDate)
            if (isNaN(dateObj.getTime())) {
                return failEvent(res, 400, 'Date invalide')
            }
            event.eventDate = eventDate
            event.fullEventDate = dateObj
        }

        await event.save()

        res.json({
            success: true,
            message: 'Événement mis à jour avec succès',
            data: event
        })
    } catch (error) {
        console.error('Error updating event:', error)
        failEvent(res, 500, "Erreur lors de la mise à jour de l'événement", error)
    }
}

/**
 * Supprimer un événement
 * DELETE /api/v2/app/events/:id
 * Requiert authentification admin
 *
 * Les messages du fil de discussion sont supprimés avec l'événement : sans
 * cela ils restaient en base indéfiniment, rattachés à un événement disparu.
 */
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return failEvent(res, 400, "ID d'événement invalide")
        }

        const event = await Event.findByIdAndDelete(id)

        if (!event) {
            return failEvent(res, 404, 'Événement non trouvé')
        }

        const { deletedCount } = await EventMessage.deleteMany({ eventId: id })

        res.json({
            success: true,
            message: 'Événement supprimé avec succès',
            data: { deletedMessages: deletedCount }
        })
    } catch (error) {
        console.error('Error deleting event:', error)
        failEvent(res, 500, "Erreur lors de la suppression de l'événement", error)
    }
}

/**
 * Récupérer toutes les vidéos d'un salon (pour l'écran d'accueil)
 * GET /api/v2/app/all-posts?salon=:salonId
 */
const getAllPosts = async (req, res) => {
    try {
        const { salon } = req.query

        if (!salon) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID requis dans la query (?salon=:id)'
            })
        }

        // Récupérer toutes les vidéos du salon avec statut actif
        const posts = await ExposantVideo.find({ salon, statut: 1 })
            .populate('exposantId', 'nom email bio profil cover location isValid phoneNumber linkedinLink facebookLink instaLink weblink')
            .sort({ createdAt: -1 }) // Tri par date de création décroissante (récent → ancien)

        console.log(`📹 [getAllPosts] Salon: ${salon}, Vidéos trouvées: ${posts.length}`)
        if (posts.length > 0) {
            console.log(`📹 [getAllPosts] Exemple vidéo:`, {
                _id: posts[0]._id,
                videoUrl: posts[0].videoUrl,
                name: posts[0].name,
                exposantId: posts[0].exposantId?._id,
                isValid: posts[0].exposantId?.isValid
            })
        }

        // Inverser l'ordre pour avoir les plus anciennes en premier (comme dans SalonApp2)
        res.json(posts.reverse())
    } catch (error) {
        console.error('Error getting all posts:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des vidéos',
            error: error.message
        })
    }
}

/**
 * Envoyer une demande de rendez-vous à un exposant
 * POST /api/v2/app/make-rdv
 */
const makeRDV = async (req, res) => {
    try {
        const { exposantId, name, email, phoneNumber, message, salon } = req.body

        // Validation
        if (!exposantId || !name || !email || !phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis (exposantId, name, email, phoneNumber, message)'
            })
        }

        // Vérifier que l'exposant existe
        const exposant = await Exposant.findById(exposantId)
        if (!exposant) {
            return res.status(404).json({
                success: false,
                message: 'Exposant non trouvé'
            })
        }

        // Créer le RDV en base de données
        const rdv = new Rdv({
            exposant: exposantId,
            salon: salon || null,
            name,
            email,
            phoneNumber,
            message,
            status: 'pending'
        })

        await rdv.save()

        // Configuration du transporteur email
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        })

        // Contenu de l'email
        const emailContent = `
            <h2>Nouvelle demande de rendez-vous</h2>
            <p>Bonjour ${exposant.nom},</p>
            <p>Vous avez reçu une nouvelle demande de rendez-vous de la part de :</p>
            <ul>
                <li><strong>Nom:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Téléphone:</strong> ${phoneNumber}</li>
                <li><strong>Message:</strong></li>
            </ul>
            <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                ${message.replace(/\n/g, '<br>')}
            </p>
            <p>Merci de prendre contact avec cette personne dès que possible.</p>
            <p>Cordialement,<br>Service RDV Dormans</p>
        `

        // Envoyer l'email
        try {
            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: exposant.email,
                subject: 'Demande de rendez-vous - Dormans',
                html: emailContent,
            })

            console.log('Email de rendez-vous envoyé:', info.messageId)

            res.json({
                success: true,
                status: 200,
                message: 'Demande de rendez-vous envoyée avec succès',
                data: rdv,
                info: {
                    messageId: info.messageId,
                }
            })
        } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailError)
            // Même si l'email échoue, le RDV est enregistré en base
            res.json({
                success: true,
                status: 200,
                message: 'Demande de rendez-vous enregistrée (email non envoyé)',
                data: rdv,
                warning: 'L\'email n\'a pas pu être envoyé, mais la demande a été enregistrée'
            })
        }
    } catch (error) {
        console.error('Erreur lors de la demande de rendez-vous:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la demande de rendez-vous',
            error: error.message
        })
    }
}

/**
 * Récupérer tous les RDV d'un exposant
 * GET /api/v2/app/my-rdv
 * Requiert authentification exposant
 */
const getMyRdv = async (req, res) => {
    try {
        const exposantId = req.exposantId

        if (!exposantId) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            })
        }

        const rdvs = await Rdv.find({ exposant: exposantId })
            .populate('exposant', 'nom profil')
            .populate('salon', 'nom slug')
            .sort({ createdAt: -1 })

        res.json({
            success: true,
            count: rdvs.length,
            data: rdvs
        })
    } catch (error) {
        console.error('Error getting RDV:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des rendez-vous',
            error: error.message
        })
    }
}

/**
 * Mettre à jour un RDV (statut, notes, date)
 * PATCH /api/v2/app/rdv/:id
 * Requiert authentification exposant
 */
const updateRdv = async (req, res) => {
    try {
        const { id } = req.params
        const exposantId = req.exposantId
        const { status, notes, appointmentDate } = req.body

        if (!exposantId) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            })
        }

        // Vérifier que le RDV appartient à l'exposant
        const rdv = await Rdv.findOne({ _id: id, exposant: exposantId })

        if (!rdv) {
            return res.status(404).json({
                success: false,
                message: 'Rendez-vous non trouvé'
            })
        }

        // Mise à jour des champs
        if (status) rdv.status = status
        if (notes !== undefined) rdv.notes = notes
        if (appointmentDate) rdv.appointmentDate = appointmentDate

        await rdv.save()

        const updatedRdv = await Rdv.findById(id)
            .populate('exposant', 'nom profil')
            .populate('salon', 'nom slug')

        res.json({
            success: true,
            message: 'Rendez-vous mis à jour avec succès',
            data: updatedRdv
        })
    } catch (error) {
        console.error('Error updating RDV:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du rendez-vous',
            error: error.message
        })
    }
}

/**
 * Supprimer/Annuler un RDV
 * DELETE /api/v2/app/rdv/:id
 * Requiert authentification exposant
 */
const deleteRdv = async (req, res) => {
    try {
        const { id } = req.params
        const exposantId = req.exposantId

        if (!exposantId) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            })
        }

        // Vérifier que le RDV appartient à l'exposant
        const rdv = await Rdv.findOne({ _id: id, exposant: exposantId })

        if (!rdv) {
            return res.status(404).json({
                success: false,
                message: 'Rendez-vous non trouvé'
            })
        }

        // Au lieu de supprimer, on peut juste annuler
        rdv.status = 'cancelled'
        await rdv.save()

        res.json({
            success: true,
            message: 'Rendez-vous annulé avec succès',
            data: rdv
        })
    } catch (error) {
        console.error('Error deleting RDV:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'annulation du rendez-vous',
            error: error.message
        })
    }
}

module.exports = {
    getVersion,
    getAllCategories,
    createCategory,
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getAllPosts,
    makeRDV,
    getMyRdv,
    updateRdv,
    deleteRdv
}

