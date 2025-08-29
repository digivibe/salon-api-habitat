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
const sendEmail = require('../libs/mailSender')

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
            isValid: 0,
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
        const mailContent = `
<body style="margin:0;padding:0;background:#f5f7fb;">
  <center style="width:100%;background:#f5f7fb;">
    <!-- Wrapper -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <!-- Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8ecf5;">
            <!-- Header -->
            <tr>
              <td style="padding:24px 28px;background:#0b1b34;">
                <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:24px;color:#ffffff;">
                  🎉 Nouveau exposant inscrit
                </h1>
                <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#c8d3e6;">
                  Un nouvel exposant vient de créer un compte sur votre plateforme.
                </p>
              </td>
            </tr>

            <!-- Summary badges -->
            <tr>
              <td style="padding:16px 28px 0 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 12px 0;">
                      <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#eef4ff;color:#1e40af;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:12px;">
                        Catégorie : \${(categorieExist && (categorieExist.name || categorieExist.nom || categorieExist.label)) || trimmedData.categorie}
                      </span>
                      <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#ecfdf5;color:#065f46;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:12px;margin-left:6px;">
                        Statut : En attente de validation
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Details title -->
            <tr>
              <td style="padding:8px 28px 0 28px;">
                <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;color:#0b1b34;">
                  Détails de l’exposant
                </h2>
              </td>
            </tr>

            <!-- Details table -->
            <tr>
              <td style="padding:0 28px 8px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #edf1f7;border-radius:10px;overflow:hidden;">
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Nom / Identifiant
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111827;">
                      \${trimmedData.nom}
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Email
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111827;word-break:break-all;">
                      \${trimmedData.email}
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Téléphone
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111827;">
                      \${trimmedData.phoneNumber || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Localisation
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111827;">
                      \${trimmedData.location}
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Catégorie
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111827;">
                      \${(categorieExist && (categorieExist.name || categorieExist.nom || categorieExist.label)) || trimmedData.categorie}
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Bio
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111827;">
                      \${trimmedData.bio}
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      LinkedIn
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1d4ed8;">
                      <a href="\${trimmedData.linkedinLink || '#'}" style="color:#1d4ed8;text-decoration:underline;">\${trimmedData.linkedinLink || "—"}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Facebook
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1d4ed8;">
                      <a href="\${trimmedData.facebookLink || '#'}" style="color:#1d4ed8;text-decoration:underline;">\${trimmedData.facebookLink || "—"}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Instagram
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #edf1f7;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1d4ed8;">
                      <a href="\${trimmedData.instaLink || '#'}" style="color:#1d4ed8;text-decoration:underline;">\${trimmedData.instaLink || "—"}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="width:38%;padding:12px 14px;background:#fafbfe;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4b5563;">
                      Site Web
                    </td>
                    <td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1d4ed8;">
                      <a href="\${trimmedData.weblink || '#'}" style="color:#1d4ed8;text-decoration:underline;">\${trimmedData.weblink || "—"}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Actions -->
            <tr>
              <td align="center" style="padding:20px 28px 28px 28px;">
                <a href="\${process.env.ADMIN_URL || 'https://votre-admin.example.com/exposants'}" 
                   style="display:inline-block;padding:12px 18px;background:#008f00;color:#ffffff;text-decoration:none;border-radius:10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
                  Ouvrir l’admin
                </a>
                <a href="mailto:\${trimmedData.email}" 
                   style="display:inline-block;padding:12px 18px;background:#0b1b34;color:#ffffff;text-decoration:none;border-radius:10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;margin-left:8px;">
                  Contacter l’exposant
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:12px 28px 24px 28px;background:#f8fafc;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#64748b;">
                  Cet email vous a été envoyé automatiquement suite à une inscription. ID visiteur: 
                  <span style="font-weight:bold;color:#0b1b34;">\${typeof visitorId !== 'undefined' ? visitorId : '—'}</span>.
                </p>
              </td>
            </tr>
          </table>
          <!-- /Container -->
        </td>
      </tr>
    </table>
    <!-- /Wrapper -->
  </center>
</body>
`;

        await sendEmail('digivibe.fr@gmail.com', 'Nouveau exposant inscrit', mailContent)

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

