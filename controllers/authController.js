const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const { tokenCreator } = require('../libs/tokenCreator')
const { generatePassword, cryptPassword } = require('../libs/generatePassword')
const sendPassword = require('../libs/mailSenderForgotPassword')
const { checkExposantLogin } = require('../libs/checkExposantLogin')
const { visitorIdByToken } = require('../libs/visitorIdByToken')
const Categorie = require('../models/categorieModel')
const Exposant = require('../models/exposantModel')
const Login = require('../models/loginModel')

exports.addMultipleExposants = async (req, res) => {
    try {
        const { exposants } = req.body
        
        if (!Array.isArray(exposants) || exposants.length === 0) {
            return res.status(400).json({ message: 'Veuillez fournir une liste valide d’exposants' })
        }

        let createdExposants = []

        for (let exposant of exposants) {
            const {
                categorie, email, nom, location, bio, phoneNumber, linkedinLink, facebookLink, instaLink, weblink, password
            } = exposant

            let message = ''

            
            const trimmedData = {
                categorie: categorie ? categorie.trim() : '',
                email: email ? email.trim() : '',
                password: password ? password.trim() : crypto.randomBytes(6).toString('hex'),
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
                console.log(`❌ Exposant ignoré: ${nom} (Catégorie manquante)`)
                continue
            }

            const categorieExist = await Categorie.findById(trimmedData.categorie)
            if (!categorieExist) {
                console.log(`❌ Exposant ignoré: ${nom} (Catégorie invalide)`)
                continue
            }

            if (!trimmedData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedData.email)) {
                console.log(`❌ Exposant ignoré: ${nom} (Email invalide)`)
                continue
            }

            const emailExists = await Exposant.findOne({ email: trimmedData.email })
            if (emailExists) {
                console.log(`❌ Exposant ignoré: ${nom} (Email déjà utilisé)`)
                continue
            }

            const nameExists = await Exposant.findOne({ nom: trimmedData.nom })
            if (nameExists) {
                console.log(`❌ Exposant ignoré: ${nom} (Nom déjà utilisé)`)
                continue
            }

            if (!trimmedData.nom || trimmedData.nom.length > 100) {
                console.log(`❌ Exposant ignoré: ${email} (Nom invalide)`)
                continue
            }

            if (!trimmedData.location || trimmedData.location.length > 256) {
                console.log(`❌ Exposant ignoré: ${email} (Adresse invalide)`)
                continue
            }

            if (!trimmedData.bio || trimmedData.bio.length > 256) {
                console.log(`❌ Exposant ignoré: ${email} (Bio invalide)`)
                continue
            }

            if (trimmedData.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(trimmedData.phoneNumber)) {
                console.log(`❌ Exposant ignoré: ${email} (Numéro de téléphone invalide)`)
                continue
            }

            const newExposant = new Exposant({
                categorie: trimmedData.categorie,
                email: trimmedData.email,
                username: trimmedData.email,
                password: trimmedData.password,
                nom: trimmedData.nom,
                location: trimmedData.location,
                bio: trimmedData.bio,
                phoneNumber: trimmedData.phoneNumber,
                linkedinLink: trimmedData.linkedinLink,
                facebookLink: trimmedData.facebookLink,
                instaLink: trimmedData.instaLink,
                weblink: trimmedData.weblink
            })

            const result = await newExposant.save()

            console.log(`✅ Exposant ajouté: ${nom} (${email}) | Mot de passe: ${trimmedData.password}`)

            createdExposants.push({
                email: trimmedData.email,
                nom: trimmedData.nom,
                bio: trimmedData.bio,
                location: trimmedData.location,
                phoneNumber: trimmedData.phoneNumber,
                password: trimmedData.password
            })
        }

        res.status(201).json({
            message: `${createdExposants.length} exposants ajoutés avec succès`,
            exposants: createdExposants
        })
    } catch (error) {
        console.error('❌ Erreur serveur:', error.message)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}

exports.signup = async (req, res) => {
    const {
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
    } = req.body;

    let message = "";

    try {
        const token = await tokenCreator(req.body.token);
        const visitorId = await visitorIdByToken(token);

        // Nettoyage des données
        const trimmedData = {
            categorie: categorie ? categorie.trim() : '',
            email: email ? email.trim() : '',
            password: password ? password.trim() : '',
            confirmPassword: confirmPassword ? confirmPassword.trim() : '',
            nom: nom ? nom.trim() : '',
            location: location ? location.trim() : '',
            bio: bio ? bio.trim() : '',
            phoneNumber: phoneNumber ? phoneNumber.trim() : '',
            linkedinLink: linkedinLink ? linkedinLink.trim() : '',
            facebookLink: facebookLink ? facebookLink.trim() : '',
            instaLink: instaLink ? instaLink.trim() : '',
            weblink: weblink ? weblink.trim() : ''
        };

        if (!trimmedData.categorie) {
            message = "Veuillez choisir la catégorie!";
            throw new Error(message);
        }

        const categorieExist = await Categorie.findById(categorie);
        if (!categorieExist) {
            message = "Veuillez choisir la catégorie!";
            throw new Error(message);
        }

        if (!trimmedData.email || trimmedData.email.length === 0 || trimmedData.email.length > 256) {
            message = "Veuillez saisir votre email. Pas plus de 256 caractères!";
            throw new Error(message);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedData.email)) {
            message = "Format de l'email saisi invalide!";
            throw new Error(message);
        }

        const existingUser2 = await Exposant.findOne({ email: trimmedData.email });
        if (existingUser2) {
            message = "Cet email est déjà utilisé par un autre compte!";
            throw new Error(message);
        }

        const existingUser3 = await Exposant.findOne({ nom: trimmedData.nom });
        if (existingUser3) {
            message = "Cet identifiant est déjà utilisé par un autre compte!";
            throw new Error(message);
        }

        if (!(trimmedData.password && trimmedData.password.length >= 5 && trimmedData.password.length <= 20)) {
            message = "Le mot de passe doit être compris entre 5 et 20 caractères!";
            throw new Error(message);
        }

        if (trimmedData.password !== trimmedData.confirmPassword) {
            message = "Les mots de passe ne correspondent pas!";
            throw new Error(message);
        }

        if (!trimmedData.nom || trimmedData.nom.length === 0 || trimmedData.nom.length > 100) {
            message = "Veuillez saisir le nom. Pas plus de 100 caractères!";
            throw new Error(message);
        }

        if (!trimmedData.location || trimmedData.location.length === 0 || trimmedData.location.length > 256) {
            message = "Veuillez saisir l'adresse. Pas plus de 256 caractères!";
            throw new Error(message);
        }

        if (!trimmedData.bio || trimmedData.bio.length === 0 || trimmedData.bio.length > 256) {
            message = "Veuillez saisir la bio. Pas plus de 256 caractères!";
            throw new Error(message);
        }

        if (trimmedData.linkedinLink && trimmedData.linkedinLink.length > 256) {
            message = "Le lien LinkedIn ne doit pas dépasser 256 caractères!";
            throw new Error(message);
        }

        const phoneMatch = /^\+?[1-9]\d{1,14}$/;
        if (!trimmedData.phoneNumber || trimmedData.phoneNumber.length > 20) {
            message = "Le numéro de téléphone doit être au format valide!";
            throw new Error(message);
        }

        const newExposant = new Exposant({
            categorie: trimmedData.categorie,
            email: trimmedData.email,
            username: trimmedData.email,
            password: trimmedData.password,
            nom: trimmedData.nom,
            location: trimmedData.location,
            bio: trimmedData.bio,
            phoneNumber: trimmedData.phoneNumber,
            linkedinLink: trimmedData.linkedinLink,
            facebookLink: trimmedData.facebookLink,
            instaLink: trimmedData.instaLink,
            weblink: trimmedData.weblink
        });

        const result = await newExposant.save();

        const newLogin = new Login({
            visitorId,
            exposantId: result._id,
            session: 1
        });
        await newLogin.save();

        const existingUser = await Exposant.findOne({ email: trimmedData.email });
        res.status(200).json({ status: 200, message: "DONE", token, exposant_infos: existingUser });
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de l'inscription", error: error.message });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body
    let message = ""
    try {
        const token = await tokenCreator(req.body.token)
        const visitorId = await visitorIdByToken(token)
        const username = email.trim();
        const existingEmail = await Exposant.findOne({ email })
        const existingIdentifiant = await Exposant.findOne({ username })

        if (!existingEmail && !existingIdentifiant) {
            message = "Identifiant ou mot de passe incorrect!"
            throw new Error(message)
        }

        const existingUser = existingEmail || existingIdentifiant;

        const isMatch = await bcrypt.compare(password, existingUser.password)
        if (!isMatch) {
            message = "Email ou mot de passe incorrect!"
            throw new Error(message)
        }

        const newLogin = new Login({
            visitorId,
            exposantId: existingUser._id,
            session: 1
        })
        await newLogin.save()

        res.status(200).json({ status: 200, message: "DONE", token, exposant_infos: existingUser })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la connexion", error: error.message })
        console.log(error)
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validation de l'email
        if (!email) {
            return res.status(400).json({ status: 400, message: "Veuillez fournir un email valide." });
        }

        // Vérification de l'existence de l'utilisateur
        const existingUser = await Exposant.findOne({ email });

        if (!existingUser) {
            message = "Aucun compte associé à cet email"
            throw new Error(message)
        }


        // Génération d'un nouveau mot de passe
        const newPassword = generatePassword();
        existingUser.password = newPassword;

        // Sauvegarder l'utilisateur avec le middleware qui hache le mot de passe
        await existingUser.save();

        // Préparation du contenu de l'email
        const emailContent = `
        <tr>
        <td style="padding-bottom: 20px;" align="center" valign="top" class="imgHero"></td>
        </tr>
        <tr>
        <td style="padding-bottom: 20px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
        <p style="color: #000000; font-size: 20px; line-height: 1.5; margin-bottom: 10px;">
        Bonjour ${existingUser.nom},
        </p>
        <p style="color: #000000; font-size: 24px; line-height: 1.5;font-weight: bold;">
        Voici votre nouveau mot de passe :
        </p>
        <p style="color: #000000; font-size: 24px; line-height: 1.5; font-weight: bold; text-align: center; margin-top: 10px;">
        ${newPassword}
        </p>
        <p style="color: #000000; font-size: 16px; line-height: 1.5; margin-top: 20px;">
        Vous pouvez désormais utiliser ce nouveau mot de passe pour accéder à notre application. En cas de questions ou d'assistance supplémentaire, n'hésitez pas à nous contacter.
        </p>
        </td>
        </tr>
        `;

        // Envoi de l'email avec le nouveau mot de passe
        const emailResponse = await sendPassword({
            to: email,
            subject: 'Nouveau Mot de Passe',
            html: emailContent
        });

        if (!emailResponse.success) {
            throw new Error(emailResponse.error || 'Erreur lors de l\'envoi de l\'email.');
        }

        // Réponse réussie
        res.status(200).json({
            status: 200,
            message: "Mot de passe envoyé avec succès.",
            password: newPassword
        });

    } catch (error) {
        // Gestion centralisée des erreurs
        console.error(error);
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la demande de nouveau mot de passe.",
            error: error.message,
        });
    }
};

exports.checkPassword = async (req, res) => {
    const { token, password } = req.body
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token);

        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!";
            throw new Error(message);
        }

        const myinfo = await Exposant.findById(expoStatut);
        if (!myinfo) {
            message = "Vous n'êtes pas autorisé pour effectuer cette action!"
            throw new Error(message)
        }

        const isMatch = await bcrypt.compare(password, myinfo.password)
        if (!isMatch) {
            message = "Mot de passe incorrect"
            throw new Error(message)
        }

        res.status(200).json({ status: 200, message: "DONE" })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la connexion", error: error.message })
        console.log(error)
    }
}

