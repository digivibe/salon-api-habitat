const Categorie = require('../models/Categorie')
const Event = require('../models/Event')
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
                api: 'v2'
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
 * Récupérer tous les événements (indépendants des salons)
 * GET /api/v2/app/events
 */
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ statut: 1 })
            .sort({ fullEventDate: -1 })
            .select('titre description fullEventDate eventDate createdAt')

        res.json({
            success: true,
            count: events.length,
            data: events
        })
    } catch (error) {
        console.error('Error getting events:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des événements',
            error: error.message
        })
    }
}

/**
 * Récupérer un événement par ID
 * GET /api/v2/app/events/:id
 */
const getEventById = async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Event ID requis'
            })
        }

        const event = await Event.findById(id).select('titre description fullEventDate eventDate statut createdAt')

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            })
        }

        if (event.statut !== 1) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            })
        }

        res.json({
            success: true,
            data: event
        })
    } catch (error) {
        console.error('Error getting event by ID:', error)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID d\'événement invalide',
                error: error.message
            })
        }
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'événement',
            error: error.message
        })
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
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis (titre, description)'
            })
        }

        if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
            return res.status(400).json({
                success: false,
                message: 'Format de date invalide (format requis: YYYY-MM-DD)'
            })
        }

        if (titre.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Le titre ne doit pas dépasser 100 caractères'
            })
        }

        if (description.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'La description ne doit pas dépasser 500 caractères'
            })
        }

        // Convertir la date en objet Date
        let eventDateObj
        if (fullEventDate) {
            eventDateObj = new Date(fullEventDate)
        } else if (eventDate) {
            eventDateObj = new Date(eventDate)
        } else {
            return res.status(400).json({
                success: false,
                message: 'Une date est requise (eventDate ou fullEventDate)'
            })
        }

        if (isNaN(eventDateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Date invalide'
            })
        }

        const event = await Event.create({
            eventDate: eventDate || eventDateObj.toISOString().split('T')[0],
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
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'événement',
            error: error.message
        })
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

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Event ID requis'
            })
        }

        const event = await Event.findById(id)

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            })
        }

        // Validation
        if (titre && titre.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Le titre ne doit pas dépasser 100 caractères'
            })
        }

        if (description && description.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'La description ne doit pas dépasser 500 caractères'
            })
        }

        if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
            return res.status(400).json({
                success: false,
                message: 'Format de date invalide (format requis: YYYY-MM-DD)'
            })
        }

        // Mise à jour des champs
        if (titre !== undefined) event.titre = titre
        if (description !== undefined) event.description = description
        if (statut !== undefined) event.statut = statut

        // Gestion des dates
        if (fullEventDate) {
            const dateObj = new Date(fullEventDate)
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Date invalide'
                })
            }
            event.fullEventDate = dateObj
            event.eventDate = dateObj.toISOString().split('T')[0]
        } else if (eventDate) {
            const dateObj = new Date(eventDate)
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Date invalide'
                })
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
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID d\'événement invalide',
                error: error.message
            })
        }
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'événement',
            error: error.message
        })
    }
}

/**
 * Supprimer un événement
 * DELETE /api/v2/app/events/:id
 * Requiert authentification admin
 */
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Event ID requis'
            })
        }

        const event = await Event.findById(id)

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            })
        }

        await Event.findByIdAndDelete(id)

        res.json({
            success: true,
            message: 'Événement supprimé avec succès'
        })
    } catch (error) {
        console.error('Error deleting event:', error)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID d\'événement invalide',
                error: error.message
            })
        }
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'événement',
            error: error.message
        })
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

