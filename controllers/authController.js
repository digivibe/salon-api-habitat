const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Exposant = require('../models/Exposant')
const Categorie = require('../models/Categorie')
const Invite = require('../models/Invite')

/**
 * Générer un token JWT
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    })
}

/**
 * Inscription d'un nouvel exposant
 * POST /api/v2/auth/register
 */
const register = async (req, res) => {
    try {
        const {
            salon,
            categorie,
            email,
            password,
            confirmPassword,
            nom,
            location,
            bio,
            phoneNumber,
            linkedinLink,
            facebookLink,
            instaLink,
            weblink
        } = req.body

        // Validation des champs requis
        if (!salon || !categorie || !email || !password || !nom || !location || !bio) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs requis doivent être fournis (salon, categorie, email, password, nom, location, bio)'
            })
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Format d\'email invalide'
            })
        }

        // Validation du mot de passe
        if (password.length < 5 || password.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir entre 5 et 20 caractères'
            })
        }

        // Vérifier que les mots de passe correspondent
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Les mots de passe ne correspondent pas'
            })
        }

        // Vérifier que la catégorie existe
        const categorieExist = await Categorie.findOne({ _id: categorie, salon, statut: 1 })
        if (!categorieExist) {
            return res.status(400).json({
                success: false,
                message: 'Catégorie invalide ou n\'appartient pas à ce salon'
            })
        }

        // Vérifier si l'email existe déjà pour ce salon
        const existingEmail = await Exposant.findOne({ salon, email })
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé pour ce salon'
            })
        }

        // Vérifier si le nom existe déjà pour ce salon
        const existingNom = await Exposant.findOne({ salon, nom })
        if (existingNom) {
            return res.status(400).json({
                success: false,
                message: 'Ce nom est déjà utilisé pour ce salon'
            })
        }

        // Créer le nouvel exposant
        const newExposant = await Exposant.create({
            salon,
            categorie,
            email: email.trim().toLowerCase(),
            username: email.trim().toLowerCase(),
            password,
            nom: nom.trim(),
            location: location.trim(),
            bio: bio.trim(),
            phoneNumber: phoneNumber?.trim() || '',
            linkedinLink: linkedinLink?.trim() || '',
            facebookLink: facebookLink?.trim() || '',
            instaLink: instaLink?.trim() || '',
            weblink: weblink?.trim() || '',
            isValid: 0, // En attente de validation
            statut: 1
        })

        // Générer le token JWT
        const token = generateToken(newExposant._id)

        // Retourner les informations (sans le mot de passe)
        const exposantData = newExposant.toObject()
        delete exposantData.password

        res.status(201).json({
            success: true,
            message: 'Inscription réussie. Votre compte est en attente de validation.',
            data: {
                token,
                exposant: exposantData
            }
        })
    } catch (error) {
        console.error('Error in register:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: error.message
        })
    }
}

/**
 * Connexion d'un exposant
 * POST /api/v2/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password, salon } = req.body

        // Validation des champs requis
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis'
            })
        }

        // Trouver l'exposant par email
        const exposant = await Exposant.findOne({ email: email.trim().toLowerCase() })
            .populate('categorie', 'label color borderColor')
            .populate('salon', 'nom slug')

        if (!exposant) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            })
        }

        // Vérifier que l'exposant appartient au salon si salon est fourni
        if (salon && exposant.salon.toString() !== salon.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas accès à ce salon'
            })
        }

        // Vérifier que l'exposant est actif
        if (exposant.statut === 0) {
            return res.status(403).json({
                success: false,
                message: 'Votre compte est désactivé'
            })
        }

        // Vérifier le mot de passe
        const isPasswordValid = await exposant.comparePassword(password)
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            })
        }

        // Générer le token JWT
        const token = generateToken(exposant._id)

        // Retourner les informations (sans le mot de passe)
        const exposantData = exposant.toObject()
        delete exposantData.password

        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                token,
                exposant: exposantData
            }
        })
    } catch (error) {
        console.error('Error in login:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion',
            error: error.message
        })
    }
}

/**
 * Mot de passe oublié
 * POST /api/v2/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email requis'
            })
        }

        // Trouver l'exposant
        const exposant = await Exposant.findOne({ email: email.trim().toLowerCase() })

        if (!exposant) {
            // Pour des raisons de sécurité, on ne révèle pas si l'email existe
            return res.json({
                success: true,
                message: 'Si cet email existe, un nouveau mot de passe vous sera envoyé'
            })
        }

        // Générer un nouveau mot de passe aléatoire
        const crypto = require('crypto')
        const newPassword = crypto.randomBytes(8).toString('hex')

        // Mettre à jour le mot de passe
        exposant.password = newPassword
        await exposant.save()

        // TODO: Envoyer l'email avec le nouveau mot de passe
        // const { sendPasswordEmail } = require('../services/emailService')
        // await sendPasswordEmail(exposant.email, exposant.nom, newPassword)

        res.json({
            success: true,
            message: 'Si cet email existe, un nouveau mot de passe vous sera envoyé',
            // En développement, on peut retourner le mot de passe (à supprimer en production)
            ...(process.env.NODE_ENV === 'development' && { password: newPassword })
        })
    } catch (error) {
        console.error('Error in forgotPassword:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la demande de nouveau mot de passe',
            error: error.message
        })
    }
}

/**
 * Vérifier le mot de passe actuel
 * POST /api/v2/auth/check-password
 * Requiert authentification
 */
const checkPassword = async (req, res) => {
    try {
        const { password } = req.body

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe requis'
            })
        }

        // L'exposant est déjà dans req.exposant grâce au middleware requireAuth
        const isPasswordValid = await req.exposant.comparePassword(password)

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe incorrect'
            })
        }

        res.json({
            success: true,
            message: 'Mot de passe correct'
        })
    } catch (error) {
        console.error('Error in checkPassword:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification du mot de passe',
            error: error.message
        })
    }
}

/**
 * Récupérer les informations de l'exposant connecté
 * GET /api/v2/auth/me
 * Requiert authentification
 */
const getMe = async (req, res) => {
    try {
        // L'exposant est déjà dans req.exposant grâce au middleware requireAuth
        const exposant = await Exposant.findById(req.exposantId)
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
        console.error('Error in getMe:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des informations',
            error: error.message
        })
    }
}

/**
 * Inscription d'un invité (avec compte)
 * POST /api/v2/auth/invites/register
 */
const registerInvite = async (req, res) => {
    try {
        const { nom, email, password } = req.body

        // Validation des champs requis
        if (!nom || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs requis doivent être fournis (nom, email, password)'
            })
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Format d\'email invalide'
            })
        }

        // Validation du mot de passe
        if (password.length < 5 || password.length > 256) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir entre 5 et 256 caractères'
            })
        }

        // Vérifier si l'email existe déjà
        const existingInvite = await Invite.findOne({ email: email.trim().toLowerCase() })
        if (existingInvite) {
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
            statut: 1, // Actif par défaut
            isActive: true
        })

        // Générer le token JWT
        const token = generateToken(newInvite._id)

        // Retourner les informations (sans le mot de passe)
        const inviteData = newInvite.toObject()
        delete inviteData.password

        res.status(201).json({
            success: true,
            message: 'Inscription réussie',
            data: {
                token,
                invite: inviteData
            }
        })
    } catch (error) {
        console.error('Error in registerInvite:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: error.message
        })
    }
}

/**
 * Connexion d'un invité (avec compte)
 * POST /api/v2/auth/invites/login
 */
const loginInvite = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validation des champs requis
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis'
            })
        }

        // Trouver l'invité par email
        const invite = await Invite.findOne({ email: email.trim().toLowerCase() })

        if (!invite) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            })
        }

        // Vérifier que l'invité est actif
        if (invite.statut === 0 || !invite.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Votre compte est désactivé'
            })
        }

        // Vérifier le mot de passe
        const isPasswordValid = await invite.comparePassword(password)
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            })
        }

        // Générer le token JWT
        const token = generateToken(invite._id)

        // Retourner les informations (sans le mot de passe)
        const inviteData = invite.toObject()
        delete inviteData.password

        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                token,
                invite: inviteData
            }
        })
    } catch (error) {
        console.error('Error in loginInvite:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion',
            error: error.message
        })
    }
}

module.exports = {
    register,
    login,
    registerInvite,
    loginInvite,
    forgotPassword,
    checkPassword,
    getMe
}

