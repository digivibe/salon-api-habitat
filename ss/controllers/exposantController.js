const bcrypt = require('bcryptjs')

const { checkExposantLogin } = require('../libs/checkExposantLogin')
const ExposantVideo = require('../models/exposantVideoModel')
const ExposantBondeal = require('../models/exposantBondealModel')
const Exposant = require('../models/exposantModel')
const Categorie = require('../models/categorieModel')
const Comment = require('../models/commentModel');
const Like = require('../models/likeModel');
const Login = require('../models/loginModel');
const { deleteByUrl } = require("../middlewares/uploadMiddleware")


exports.postNewVideo = async (req, res) => {
    const { token, description } = req.body
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        if (!req.file) {
            message = "Une erreur s'est produite lors du téléversement de la vidéo!"
            throw new Error(message)
        }

        const newExposantVideo = new ExposantVideo({
            exposantId: expoStatut,
            name: req.file.cloudinaryUrl,
            description
        })
        await newExposantVideo.save()

        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la publication", error: error.message })
    }
}

exports.dropVideos = async (req, res) => {
    const { id, token } = req.body
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        const video = await ExposantVideo.findById(id)
        if (!video) {
            message = "Cette vidéo n'existe pas!"
            throw new Error(message)
        }
        await deleteByUrl(video?.name)

        await ExposantVideo.deleteOne({ _id: id })
        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la requête", error: error.message })
    }
}

exports.getVideos = async (req, res) => {
    const token = req.query.token
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }
        const MyVideos = await ExposantVideo.find({ exposantId: expoStatut }).sort({ createdAt: -1 })
        res.status(200).json(MyVideos)
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la requête", error: error.message })
    }
}

exports.postNewBondeal = async (req, res) => {
    const { token, title, description } = req.body
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        if (!req.file) {
            message = "Une erreur s'est produite lors du téléversement de la photo!"
            throw new Error(message)
        }

        const newExposantBondeal = new ExposantBondeal({
            exposantId: expoStatut,
            image: req.file.cloudinaryUrl,
            title,
            description
        })
        await newExposantBondeal.save()

        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la publication", error: error.message })
    }
}

exports.dropBondeal = async (req, res) => {
    const { id, token } = req.body
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        const deal = await ExposantBondeal.findById(id)
        if (!deal) {
            message = "Ce deal n'existe pas!"
            throw new Error(message)
        }
        await deleteByUrl(deal?.image)
        await ExposantBondeal.deleteOne({ _id: id })
        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la requête", error: error.message })
    }
}

exports.getBondeals = async (req, res) => {
    const token = req.query.token
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }
        const MyBondeals = await ExposantBondeal.find({ exposantId: expoStatut }).sort({ createdAt: -1 })
        res.status(200).json(MyBondeals)
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la requête", error: error.message })
    }
}

exports.changeProfilePic = async (req, res) => {
    const token = req.body.token
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        const user = await Exposant.findById(expoStatut)

        if (!user) {
            message = "Ce user n'existe pas!"
            throw new Error(message)
        }

        if (user?.profil != "https://res.cloudinary.com/dfqiz1ndw/image/upload/v1721377650/d0ordcddjqs2edbyfcid.png") {
            await deleteByUrl(user?.profil)
        }

        if (!req.file) {
            message = "Une erreur s'est produite lors du téléversement de la photo!"
            throw new Error(message)
        }

        await Exposant.findByIdAndUpdate(expoStatut, { profil: req.file.cloudinaryUrl })

        const NV = await Exposant.findOne({ _id: expoStatut })

        res.status(200).json({ status: 200, message: "DONE", expo: NV })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la mise à jour", error: error.message })
    }
}

exports.changeCoverPic = async (req, res) => {
    const token = req.body.token
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        const user = await Exposant.findById(expoStatut)
        if (!user) {
            message = "Ce user n'existe pas!"
            throw new Error(message)
        }

        if (user?.cover != "https://res.cloudinary.com/dfqiz1ndw/image/upload/v1721377561/fnhugw7xma2zgsmmnjbh.png") {
            await deleteByUrl(user?.cover)
        }

        if (!req.file) {
            message = "Une erreur s'est produite lors du téléversement de la photo!"
            throw new Error(message)
        }

        await Exposant.findByIdAndUpdate(expoStatut, { cover: req.file.cloudinaryUrl })

        const NV = await Exposant.findOne({ _id: expoStatut })

        res.status(200).json({ status: 200, message: "DONE", expo: NV })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la mise à jour", error: error.message })
    }
}

exports.updateData = async (req, res) => {
    const {
        token,
        categorie,
        email,
        nom,
        location,
        bio,
        phoneNumber,
        linkedinLink,
        facebookLink,
        instaLink,
        weblink
    } = req.body

    let message = ""

    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        // Nettoyage des données
        const trimmedData = {
            categorie: categorie ? categorie.trim() : '',
            email: email ? email.trim() : '',
            nom: nom ? nom.trim() : '',
            location: location ? location.trim() : '',
            bio: bio ? bio.trim() : '',
            phoneNumber: phoneNumber ? phoneNumber.trim() : '',
            linkedinLink: linkedinLink ? linkedinLink.trim() : '',
            facebookLink: facebookLink ? facebookLink.trim() : '',
            instaLink: instaLink ? instaLink.trim() : '',
            weblink: weblink ? weblink.trim() : ''
        }

        if (!trimmedData.categorie) {
            message = "Veuillez choisir la catégorie!"
            throw new Error(message)
        }

        const categorieExist = await Categorie.findById(trimmedData.categorie)
        if (!categorieExist) {
            message = "La catégorie choisie n'existe pas!"
            throw new Error(message)
        }

        if (!trimmedData.email || trimmedData.email.length === 0 || trimmedData.email.length > 256) {
            message = "Veuillez saisir votre email. Pas plus de 256 caractères!"
            throw new Error(message)
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedData.email)) {
            message = "Format de l'email saisi invalide!"
            throw new Error(message)
        }

        // Vérification de l'unicité de l'email
        const existingUser2 = await Exposant.findOne({ email: trimmedData.email })
        if (existingUser2 && existingUser2._id.toString() !== expoStatut.toString()) {
            message = "Cet email est déjà utilisé par un autre compte!"
            throw new Error(message)
        }

        if (!trimmedData.nom || trimmedData.nom.length === 0 || trimmedData.nom.length > 100) {
            message = "Veuillez saisir le nom. Pas plus de 100 caractères!"
            throw new Error(message)
        }

        // Vérification de l'unicité du nom
        const existingUser3 = await Exposant.findOne({ nom: trimmedData.nom })
        if (existingUser3 && existingUser3._id.toString() !== expoStatut.toString()) {
            message = "Ce nom est déjà utilisé par un autre compte!"
            throw new Error(message)
        }

        if (!trimmedData.location || trimmedData.location.length === 0 || trimmedData.location.length > 256) {
            message = "Veuillez saisir l'adresse. Pas plus de 256 caractères!"
            throw new Error(message)
        }

        if (!trimmedData.bio || trimmedData.bio.length === 0 || trimmedData.bio.length > 256) {
            message = "Veuillez saisir la bio. Pas plus de 256 caractères!"
            throw new Error(message)
        }

        if (trimmedData.linkedinLink && trimmedData.linkedinLink.length > 256) {
            message = "Le lien LinkedIn ne doit pas dépasser 256 caractères!"
            throw new Error(message)
        }

        const phoneRegex = /^\+?[1-9]\d{1,14}$/
        if (!trimmedData.phoneNumber || trimmedData.phoneNumber.length > 20) {
            message = "Le numéro de téléphone doit être au format valide!"
            throw new Error(message)
        }

        // Mise à jour des données de l'exposant
        await Exposant.findByIdAndUpdate(expoStatut, trimmedData)

        const NV = await Exposant.findById(expoStatut)

        res.status(200).json({ status: 200, message: "DONE", expo: NV })
    } catch (error) {
        res.status(400).json({ status: 400, message: message || "Erreur lors de la mise à jour", error: error.message })
    }
}

// Fonction pour mettre à jour le statut d'un exposant par ID
exports.updateById = async (req, res) => {
    try {
        const expoStatut = req.params.id

        // Vérifie si l'ID de l'exposant est fourni
        if (!expoStatut) {
            throw new Error("Vous n'êtes pas connecté pour effectuer cette action !")
        }

        // Vérifie si l'exposant existe dans la base de données
        const exposant = await Exposant.findById(expoStatut)
        if (!exposant) {
            throw new Error("Exposant non trouvé !")
        }

        const { isValid } = req.body

        // Met à jour le statut de l'exposant
        await Exposant.findByIdAndUpdate(expoStatut, { isValid })

        // Récupère tous les exposants avec un statut de 1, triés par date de création
        const nouveauxExposants = await Exposant.find({ statut: 1 }).sort({ createdAt: 1 })

        // Répond avec succès et renvoie les nouveaux exposants
        res.status(200).json({ status: 200, message: "Mise à jour effectuée", expo: nouveauxExposants })

    } catch (error) {
        // En cas d'erreur, répond avec un message d'erreur pertinent
        res.status(200).json({ status: 400, message: error.message || "Erreur lors de la requête" })
    }
}

exports.updatePassword = async (req, res) => {
    const {
        token,
        oldPassword,
        newPassword,
    } = req.body

    let message = ""

    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        const myinfo = await Exposant.findById(expoStatut)
        if (!myinfo) {
            message = "Vous n'êtes pas autorisé pour effectuer cette action!"
            throw new Error(message)
        }

        const isMatch = await bcrypt.compare(oldPassword, myinfo.password)
        if (!isMatch) {
            message = "Mot de passe incorrect"
            throw new Error(message)
        }

        myinfo.password = newPassword
        await myinfo.save()

        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(400).json({ status: 400, message: message || "Erreur lors de la mise à jour", error: error.message })
    }
}

exports.deleteAccount = async (req, res) => {
    const {
        token,
        password,
    } = req.body

    let message = ""

    try {
        const expoStatut = await checkExposantLogin(token)

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }

        const myinfo = await Exposant.findById(expoStatut)
        if (!myinfo) {
            message = "Vous n'êtes pas autorisé pour effectuer cette action!"
            throw new Error(message)
        }

        const isMatch = await bcrypt.compare(password, myinfo.password)
        if (!isMatch) {
            message = "Mot de passe incorrect"
            throw new Error(message)
        }

        await Promise.all([
            Comment.deleteMany({ exposantId: expoStatut }),
            ExposantBondeal.deleteMany({ exposantId: expoStatut }),
            ExposantVideo.deleteMany({ exposantId: expoStatut }),
            Like.deleteMany({ exposantId: expoStatut }),
            Login.deleteMany({ exposantId: expoStatut })
        ]);

        await Exposant.findByIdAndDelete(expoStatut)

        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la mise à jour", error: error.message })
    }
}