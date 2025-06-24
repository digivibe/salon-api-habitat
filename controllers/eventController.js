const { Expo } = require('expo-server-sdk')

const { checkExposantLogin } = require('../libs/checkExposantLogin')
const Event = require('../models/eventModel')
const Exposant = require('../models/exposantModel')
const NotificationToken = require('../models/notificationTokenModel')

exports.create = async (req, res) => {
    const { token, title, description, eventDate } = req.body;
    
    let message = "";
    try {
        const expoStatut = await checkExposantLogin(token);
        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!";
            throw new Error(message);
        }
        const isAdmin = await Exposant.find({ _id: expoStatut, isValid: 3 });

        if (!isAdmin) {
            message = "Vous n'êtes pas autorisé pour effectuer cette action!";
            throw new Error(message);
        }

        const dateOnly = eventDate.split('T')[0]; // Extraire la partie date
        const fullDate = new Date(eventDate); // Convertir en objet Date pour fullEventDate

        if (!(title && title.length <= 100)) {
            message = "TITRE INVALIDE";
            throw new Error(message);
        }
        
        if (!(description && description.length <= 256)) {
            message = "DESCRIPTION INVALIDE";
            throw new Error(message);
        }

        const newEvent = new Event({
            eventDate: dateOnly, // Ancienne colonne
            fullEventDate: fullDate, // Nouvelle colonne
            titre: title,
            description
        });

        const ress = await newEvent.save();

        const tokens = await NotificationToken.find();
        const expo = new Expo();

        const messages = tokens.map(({ token }) => ({
            to: token,
            sound: 'default',
            title: 'Nouveau Événement',
            body: `Un nouvel événement "${title}" a été ajouté!`,
            data: { eventId: ress._id },
        }));

        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }

        res.status(200).json({ status: 200, eventAdd: ress });
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur lors de la création", error: error.message });
    }
};

exports.delete = async (req, res) => {
    const { token } = req.body;
    const { id } = req.params;
    
    let message = "";
    try {
        // Vérification de l'authentification de l'utilisateur
        const expoStatut = await checkExposantLogin(token);
        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!";
            throw new Error(message);
        }

        // Vérification des droits administrateur
        const isAdmin = await Exposant.findOne({ _id: expoStatut, isValid: 3 });
        if (!isAdmin) {
            message = "Vous n'êtes pas autorisé pour effectuer cette action!";
            throw new Error(message);
        }

        // Suppression de l'événement par ID
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            message = "Événement non trouvé.";
            throw new Error(message);
        }

        res.status(200).json({ status: 200, message: "Événement supprimé avec succès." });
    } catch (error) {
        res.status(400).json({ status: 400, message: message || "Erreur lors de la suppression", error: error.message });
    }
};