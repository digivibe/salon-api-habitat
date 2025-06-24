const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration de multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier temporaire pour stocker les fichiers avant l'upload
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ajoute un timestamp au nom du fichier
  }
});

const upload = multer({ storage });

// Middleware pour télécharger sur Cloudinary et gérer les types de fichiers (vidéo, image, document)
const uploadToCloudinary = (req, res, next) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  let resourceType = 'raw'; // Par défaut pour les documents et autres types de fichiers
  let transformations = {}; // Objet pour les transformations

  // Si le fichier est une vidéo, on applique les transformations TikTok
  if (req.file.mimetype.startsWith('video/')) {
    resourceType = 'video';
    // transformations = { transformation: [{ width: 1080, height: 1920, crop: 'scale' }] }; // Transformation pour TikTok (1080x1920)
    transformations = {
      transformation: [
        { aspect_ratio: "9:16", crop: "pad", background: "black" }, // Conserve le ratio et remplit avec un fond flou
        { width: 1080, height: 1920 } // Fixe la taille à 1080x1920
      ]
    }
      ;
  }

  // Si le fichier est une image, ne pas appliquer de transformation
  if (req.file.mimetype.startsWith('image/')) {
    resourceType = 'image';
    transformations = {}; // Pas de transformation
  }

  // Upload avec transformation
  cloudinary.uploader.upload(
    filePath,
    {
      resource_type: resourceType,
      ...transformations // Ajoute les transformations directement si elles existent
    },
    (error, result) => {
      if (error) {
        return res.status(500).send(error);
      }

      // Supprimer le fichier local après téléchargement vers Cloudinary
      fs.unlinkSync(filePath);

      // Ajouter l'URL de la vidéo hébergée à la requête
      req.file.cloudinaryUrl = result.secure_url;
      next();
    }
  );
};

// Fonction pour récupérer et trier les ressources par images, vidéos, et documents
const getAllCloudinaryData = async (req, res) => {
  try {
    // Récupérer les images
    const images = await cloudinary.api.resources({
      resource_type: 'image',
      max_results: 500
    });

    // Récupérer les vidéos
    const videos = await cloudinary.api.resources({
      resource_type: 'video',
      max_results: 500
    });

    // Récupérer les fichiers bruts (documents)
    const rawFiles = await cloudinary.api.resources({
      resource_type: 'raw',
      max_results: 500
    });

    // Structurer les résultats
    const allResources = {
      images: images.resources,
      videos: videos.resources,
      documents: rawFiles.resources
    };

    // Retourner les ressources triées
    res.json({ "images": allResources.images.length, "videos": allResources.videos, allResources });
  } catch (error) {
    console.error('Erreur lors de la récupération des ressources Cloudinary :', error);
    res.status(500).json({ error: 'Échec de la récupération des ressources Cloudinary' });
  }
};

// Fonction pour supprimer une ressource à partir de son URL avec le type de ressource correct
const deleteResourceByUrl = async (req, res) => {
  const { url } = req.body; // Récupérer l'URL de la vidéo ou image depuis la requête

  if (!url) {
    return res.status(400).json({ error: 'Veuillez fournir une URL' });
  }

  try {
    // Extraire le public_id et le type de ressource depuis l'URL
    const { publicId, resourceType } = getPublicIdAndResourceTypeFromUrl(url);

    // Supprimer la ressource associée au public_id avec le bon type de ressource
    const result = await deleteFile(publicId, resourceType);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors de la suppression de la ressource sur Cloudinary :', error);
    res.status(500).json({ error: 'Échec de la suppression de la ressource sur Cloudinary' });
  }
};

// Fonction pour extraire le public_id et le type de ressource à partir de l'URL
const getPublicIdAndResourceTypeFromUrl = (url) => {
  const parts = url.split('/');

  // Trouver l'index du type de ressource (par exemple 'video', 'image') juste avant "upload"
  const resourceTypeIndex = parts.indexOf('upload') - 1;
  const resourceType = parts[resourceTypeIndex]; // Le type de ressource se trouve avant "upload"

  // Récupérer la dernière partie qui contient le public_id avec l'extension
  const lastPart = parts[parts.length - 1];

  // Séparer le public_id de l'extension
  const [publicId, extension] = lastPart.split('.');

  return { publicId, resourceType, extension }; // Retourner le public_id, le type de ressource et l'extension
};

// Fonction pour supprimer un fichier avec public_id et resource_type
const deleteFile = async (publicId, resourceType) => {
  if (!publicId || !resourceType) {
    throw new Error('Veuillez fournir le public_id et le resource_type');
  }

  try {
    // Supprimer le fichier avec Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    if (result.result === 'ok') {
      return { message: 'Fichier supprimé avec succès', public_id: publicId };
    } else {
      throw new Error('Échec de la suppression du fichier');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier sur Cloudinary :', error);
    throw new Error('Échec de la suppression du fichier sur Cloudinary');
  }
};

const deleteByUrl = async (url) => {
  try {
    // Extraire le public_id et le type de ressource depuis l'URL
    const { publicId, resourceType } = getPublicIdAndResourceTypeFromUrl(url);

    // Supprimer la ressource associée au public_id avec le bon type de ressource
    return await deleteFile(publicId, resourceType);
  } catch (error) {
    console.error('Erreur lors de la suppression de la ressource sur Cloudinary :', error);
    return null;
  }
}
// Fonction pour récupérer et supprimer toutes les vidéos
const deleteAllVideos = async (req, res) => {
  try {
    // Récupérer toutes les vidéos
    const result = await cloudinary.api.resources({
      resource_type: 'video', // Filtrer pour ne récupérer que les vidéos
      max_results: 500 // Récupère jusqu'à 500 vidéos à la fois
    });

    // Vérifier s'il y a des vidéos à supprimer
    if (result.resources.length === 0) {
      return res.status(200).json({ message: 'Aucune vidéo à supprimer.' });
    }

    // Supprimer chaque vidéo récupérée
    const deletionResults = await Promise.all(
      result.resources.map(async (video) => {
        const publicId = video.public_id;
        return await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      })
    );

    // Filtrer les vidéos qui ont été supprimées avec succès
    const deletedVideos = deletionResults.filter(result => result.result === 'ok');
    const failedDeletions = deletionResults.filter(result => result.result !== 'ok');

    res.json({
      message: 'Suppression des vidéos terminée',
      deletedVideos: deletedVideos.map(result => result.public_id),
      failedDeletions: failedDeletions.map(result => result.public_id)
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des vidéos Cloudinary :', error);
    res.status(500).json({ error: 'Échec de la suppression des vidéos Cloudinary' });
  }
};

// Exporte les middlewares
module.exports = {
  upload,
  uploadToCloudinary,
  getAllCloudinaryData,
  deleteResourceByUrl,
  deleteAllVideos,
  deleteByUrl
};
