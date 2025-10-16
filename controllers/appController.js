const Categorie = require('../models/categorieModel')
const Event = require('../models/eventModel')
const Exposant = require('../models/exposantModel')
const ExposantVideo = require('../models/exposantVideoModel')
const ExposantBondeal = require('../models/exposantBondealModel')
const NotificationToken = require('../models/notificationTokenModel')


const sendEmail = require('../libs/mailSender')
const App = require('../models/appModel')

exports.getAppValue = async (req, res) => {
    const { key } = req.params
    try {
        const appRecord = await App.findOne({ key: key, statut: 1 })
        
        if (!appRecord) {
            return res.status(404).json({ message: 'Key not found or inactive' })
        }
        console.log({
            key: appRecord.key,
            value: appRecord.value,
            statut: appRecord.statut
        })
        res.json({
            key: appRecord.key,
            value: appRecord.value,
            statut: appRecord.statut
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.getAllAppValues = async (req, res) => {
    try {
        const appRecords = await App.find({ statut: 1 })
        res.json(appRecords)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.version = async (req, res) => {
    res.json({versionCode: parseInt(process.env.VERSION_CODE) || 1})
}

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Categorie.find({ statut: 1 }).sort({ label: 1 })
        res.json(categories)
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la requête', error })
    }
}

exports.createNewCategorie = async (req, res) => {
    let { passCode, color, borderColor, label } = req.body
    let message = ""
    try {
        if (passCode !== process.env.TT_PWD) {
            message = "ACCESS INTERDIT"
            throw new Error(message)
        }
        if (!(color && color.length === 7)) {
            message = "COULEUR TEXTE INCORRECT"
            throw new Error(message)
        }
        if (!(borderColor && borderColor.length === 7)) {
            message = "COULEUR BORD INCORRECT"
            throw new Error(message)
        }
        if (!(label && label.length <= 100)) {
            message = "LABEL INVALIDE"
            throw new Error(message)
        }
        const checkExistLabel = await Categorie.findOne({ label })
        if (checkExistLabel) {
            message = "LABEL EXISTE DEJA"
            throw new Error(message)
        }
        const newCategorie = new Categorie({
            color,
            borderColor,
            label
        })
        await newCategorie.save()

        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de l'ajout", error: error.message })
    }
}

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.aggregate([
            {
                $match: { statut: 1 }
            },
            {
                $sort: { fullEventDate: -1 }
            },
            {
                $project: {
                    _id: 1,
                    titre: 1,
                    description: 1,
                    fullEventDate: 1,
                }
            }
        ]);

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Erreur lors de la requête', error });
    }
}

exports.createNewEvent = async (req, res) => {
    let { passCode, eventDate, titre, description } = req.body
    let message = ""
    try {
        if (passCode !== process.env.TT_PWD) {
            message = "ACCESS INTERDIT"
            throw new Error(message)
        }
        if (!(eventDate && eventDate.length === 10)) {
            return res.status(400).json({ message: "DATE FORMAT INVALIDE" });
        }
        if (!(titre && titre.length <= 100)) {
            message = "TITRE INVALIDE"
            throw new Error(message)
        }
        const checkExistTitre = await Event.findOne({ titre })
        if (checkExistTitre) {
            message = "TITRE EXISTE DEJA"
            throw new Error(message)
        }
        if (!(description && description.length <= 256)) {
            message = "DESCRIPTION INVALIDE"
            throw new Error(message)
        }
        const newEvent = new Event({
            eventDate,
            titre,
            description
        })
        await newEvent.save()

        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de l'ajout", error: error.message })
    }
}

// Dans appController.js, remplacez la fonction getAllExposants

exports.getAllExposants = async (req, res) => {
    try {
        const exposants = await Exposant.find({ statut: 1 })
        
        // Tri personnalisé : alphabétique puis chiffres
        const sortedExposants = exposants.sort((a, b) => {
            const nameA = a.nom.toLowerCase().trim()
            const nameB = b.nom.toLowerCase().trim()
            
            // Vérifier si les noms commencent par un chiffre
            const startsWithNumberA = /^[0-9]/.test(nameA)
            const startsWithNumberB = /^[0-9]/.test(nameB)
            
            // Si l'un commence par un chiffre et pas l'autre
            if (startsWithNumberA && !startsWithNumberB) return 1  // A après B
            if (!startsWithNumberA && startsWithNumberB) return -1 // A avant B
            
            // Sinon, tri alphabétique normal
            return nameA.localeCompare(nameB, 'fr', { 
                sensitivity: 'base',
                ignorePunctuation: true 
            })
        })
        
        // IMPORTANT : Inverser l'ordre pour compenser le .reverse() du frontend
        // Le frontend fait .reverse(), donc on inverse ici pour obtenir le bon ordre final
        const reversedExposants = sortedExposants.reverse()
        
        res.json(reversedExposants)
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la requête', error })
    }
}

exports.getAllPosts = async (req, res) => {
    try {
        // ID de la vidéo à mettre en première position
        const priorityVideoId = process.env.PRIORITY_VIDEO_ID || null

        const posts = await ExposantVideo.find({ statut: 1 })
            .populate('exposantId', 'nom email bio profil cover location isValid phoneNumber linkedinLink facebookLink instaLink weblink')
            .sort({ _id: -1 }) // Du plus récent au plus vieux

        // Si un ID prioritaire est défini, réorganiser les posts
        if (priorityVideoId) {
            const priorityPost = posts.find(post => post._id.toString() === priorityVideoId)
            const otherPosts = posts.filter(post => post._id.toString() !== priorityVideoId)

            // Si la vidéo prioritaire existe, la mettre en premier
            if (priorityPost) {
                res.json([priorityPost, ...otherPosts])
            } else {
                res.json(posts)
            }
        } else {
            res.json(posts)
        }
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la requête', error })
    }
}

exports.getExposantsPosts = async (req, res) => {
    const id = req.query.id
    try {
        const posts = await ExposantVideo.find({ exposantId: id, statut: 1 }).sort({ createdAt: 1 })
        res.json(posts)
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la requête', error })
    }
}

exports.getExposantsBondeals = async (req, res) => {
    const id = req.query.id
    try {
        const posts = await ExposantBondeal.find({ exposantId: id, statut: 1 }).sort({ createdAt: 1 })
        res.json(posts)
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la requête', error })
    }
}
exports.makeRDV = async (req, res) => {
    const { exposantId, name, email, phoneNumber, message } = req.body
    let response = ""

    try {
        const exposantData = await Exposant.findById(exposantId)
        if (!exposantData) {
            response = "Impossible d'effectuer l'action!"
            throw new Error("Exposant not found")
        }
        
        const emailContent = `
            <p>Bonjour ${exposantData.nom},</p>
            <p>Vous avez une nouvelle demande de rendez-vous de la part de :</p>
            <ul>
                <li><strong>Nom:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Téléphone:</strong> ${phoneNumber}</li>
                <li><strong>Message:</strong> ${message}</li>
            </ul>
            <p>Merci de prendre contact avec cette personne dès que possible.</p>
            <p>Cordialement,</p>
            <p>Service RDV</p>
        `

        const emailResponse = await sendEmail({
            to: exposantData.email,
            subject: 'Demande de rendez-vous',
            html: emailContent
        })
        
        if (!emailResponse.success) {
            throw new Error(emailResponse.error)
        }

        res.status(200).json({ status: 200, message: 'Email sent successfully!', info: emailResponse.info })
    } catch (error) {
        res.status(400).json({ status: 400, message: response || "Erreur lors de l'inscription", error: error.message })
    }
}

exports.registerNotificationToken = async (req, res) => {
    const { userId, token } = req.body;

    try {
        // Vérifiez si le token existe déjà pour cet utilisateur
        let userToken = await NotificationToken.findOne({ userId });

        if (userToken) {
            userToken.token = token; // Mettez à jour le token
        } else {
            userToken = new NotificationToken({ userId, token });
        }

        await userToken.save();
        res.status(200).json({ status: 200, message: "Token enregistré avec succès." });
    } catch (error) {
        console.error("Erreur d'enregistrement du token:", error);
        res.status(500).json({ status: 500, message: "Erreur lors de l'enregistrement du token.", error: error.message });
    }
};
