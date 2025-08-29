const nodemailer = require('nodemailer');

/**
 * Configuration pour Zoho Mail
 * Vous devez configurer ces variables d'environnement :
 * - ZOHO_EMAIL : votre adresse email Zoho
 * - ZOHO_PASSWORD : votre mot de passe d'application Zoho
 */
class ZohoMailUtils {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Envoie un email via Zoho Mail
   * @param {string} destinataire - Adresse email du destinataire
   * @param {string} objet - Objet de l'email
   * @param {string} htmlContent - Contenu HTML de l'email
   * @param {Object} options - Options supplémentaires (cc, bcc, attachments, etc.)
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async envoyerMail(destinataire, objet, htmlContent, options = {}) {
    try {
      // Validation des paramètres obligatoires
      if (!destinataire || !objet || !htmlContent) {
        throw new Error('Destinataire, objet et contenu HTML sont obligatoires');
      }

      // Validation de l'email
      if (!this.isValidEmail(destinataire)) {
        throw new Error('Adresse email destinataire invalide');
      }

      const mailOptions = {
        from: process.env.ZOHO_EMAIL,
        to: destinataire,
        subject: objet,
        html: htmlContent,
        ...options // Permet d'ajouter cc, bcc, attachments, etc.
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('Email envoyé avec succès:', result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoie un email à plusieurs destinataires
   * @param {Array<string>} destinataires - Liste des adresses email
   * @param {string} objet - Objet de l'email
   * @param {string} htmlContent - Contenu HTML de l'email
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async envoyerMailMultiple(destinataires, objet, htmlContent, options = {}) {
    try {
      if (!Array.isArray(destinataires) || destinataires.length === 0) {
        throw new Error('La liste des destinataires doit être un tableau non vide');
      }

      // Validation de tous les emails
      const emailsInvalides = destinataires.filter(email => !this.isValidEmail(email));
      if (emailsInvalides.length > 0) {
        throw new Error(`Adresses email invalides: ${emailsInvalides.join(', ')}`);
      }

      const mailOptions = {
        from: process.env.ZOHO_EMAIL,
        to: destinataires.join(', '),
        subject: objet,
        html: htmlContent,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('Email envoyé à plusieurs destinataires:', result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        destinataires: destinataires,
        response: result.response
      };

    } catch (error) {
      console.error('Erreur lors de l\'envoi multiple:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoie un email avec pièces jointes
   * @param {string} destinataire - Adresse email du destinataire
   * @param {string} objet - Objet de l'email
   * @param {string} htmlContent - Contenu HTML de l'email
   * @param {Array<Object>} attachments - Liste des pièces jointes
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async envoyerMailAvecPJ(destinataire, objet, htmlContent, attachments = [], options = {}) {
    return await this.envoyerMail(destinataire, objet, htmlContent, {
      ...options,
      attachments: attachments
    });
  }

  /**
   * Valide une adresse email
   * @param {string} email - Adresse email à valider
   * @returns {boolean} - True si valide, false sinon
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Crée un template HTML simple
   * @param {string} titre - Titre de l'email
   * @param {string} message - Message principal
   * @param {Object} options - Options de style
   * @returns {string} - HTML généré
   */
  creerTemplateHTML(titre, message, options = {}) {
    const couleurPrimaire = options.couleurPrimaire || '#007bff';
    const couleurTexte = options.couleurTexte || '#333333';
    
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${titre}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: ${couleurTexte};
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: ${couleurPrimaire};
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titre}</h1>
        </div>
        <div class="content">
          ${message}
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Teste la connexion SMTP
   * @returns {Promise<boolean>} - True si la connexion est OK
   */
  async testerConnexion() {
    try {
      await this.transporter.verify();
      console.log('Connexion SMTP Zoho OK');
      return true;
    } catch (error) {
      console.error('Erreur de connexion SMTP:', error);
      return false;
    }
  }
}

module.exports = ZohoMailUtils;

/**
 * Fonction utilitaire pour envoyer un email (compatible avec votre code existant)
 * @param {string} destinataire - Email du destinataire
 * @param {string} objet - Objet de l'email
 * @param {string} htmlContent - Contenu HTML
 * @returns {Promise<void>}
 */
async function sendEmail(destinataire, objet, htmlContent) {
  const mailUtils = new ZohoMailUtils();
  
  try {
    const resultat = await mailUtils.envoyerMail(destinataire, objet, htmlContent);
    
    if (resultat.success) {
      console.log('Email envoyé avec succès:', resultat.messageId);
    } else {
      console.error('Échec envoi email:', resultat.error);
    }
  } catch (error) {
    console.error('Erreur dans sendEmail:', error);
  }
}

// Export de la fonction pour compatibilité
module.exports.sendEmail = sendEmail;

// Exemple d'utilisation avec votre code existant
/*
const { sendEmail } = require('./zoho-mail-utils');

// Dans votre contrôleur signup
const mailContent = `<html>Votre contenu HTML ici</html>`;
await sendEmail('digivibe.fr@gmail.com', 'Nouveau exposant inscrit', mailContent);
*/