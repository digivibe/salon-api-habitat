const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Modèle unifié pour les likes de TOUS les salons
 * Ce modèle existe UNIQUEMENT sur le serveur central
 */
const unifiedLikeSchema = new mongoose.Schema({
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
    
    // Salon d'origine (pour traçabilité et filtrage)
    salonOrigin: {
        type: String,
        enum: ['salonA', 'salonB', 'salonC'],
        required: true,
        index: true
    },
    
    // Métadonnées de l'exposant (pour éviter des requêtes cross-serveur)
    exposantData: {
        nom: String,
        profil: String,
        salon: String
    },
    
    // Métadonnées de la vidéo (pour éviter des requêtes cross-serveur)
    videoData: {
        description: String,
        exposantOwner: String, // ID du propriétaire de la vidéo
        salon: String
    }
}, { 
    collection: 'unified_likes', 
    timestamps: true 
});

// Index composé pour recherches rapides
unifiedLikeSchema.index({ exposantId: 1, videoId: 1 }, { unique: true });
unifiedLikeSchema.index({ videoId: 1, salonOrigin: 1 });
unifiedLikeSchema.index({ exposantId: 1, salonOrigin: 1 });

module.exports = mongoose.model('UnifiedLike', unifiedLikeSchema);