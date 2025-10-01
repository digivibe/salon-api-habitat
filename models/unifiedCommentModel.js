const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Modèle unifié pour les commentaires de TOUS les salons
 * Ce modèle existe UNIQUEMENT sur le serveur central
 */
const unifiedCommentSchema = new mongoose.Schema({
    // ID de l'exposant (string car peut venir de différentes BDs)
    exposantId: {
        type: String,
        required: true,
        index: true
    },

    // ID de la vidéo (string car peut venir de différentes BDs)
    videoId: {
        type: String,
        required: true,
        index: true
    },

    // Contenu du commentaire
    content: {
        type: String,
        required: true,
        maxlength: 1000
    },

    // Salon d'origine
    salonOrigin: {
        type: String,
        enum: ['salonA', 'salonB', 'salonC'],
        required: true,
        index: true
    },

    // Métadonnées de l'exposant (cache pour éviter requêtes cross-serveur)
    exposantData: {
        nom: String,
        profil: String,
        salon: String
    },

    // Métadonnées de la vidéo
    videoData: {
        description: String,
        exposantOwner: String,
        salon: String
    }
}, {
    collection: 'unified_comments',
    timestamps: true
});

// Index pour recherches rapides
unifiedCommentSchema.index({ videoId: 1, createdAt: -1 });
unifiedCommentSchema.index({ exposantId: 1, createdAt: -1 });
unifiedCommentSchema.index({ videoId: 1, salonOrigin: 1 });

module.exports = mongoose.model('UnifiedComment', unifiedCommentSchema);