require("dotenv").config(); // Charger les variables d'environnement
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const compression = require("compression"); // Compression des réponses HTTP
const connectDB = require("./config/db"); // Connexion à la base de données
const apiRouter = require("./routes/index"); // Routes API
const {
    upload,
    uploadToCloudinary,
    getAllCloudinaryData,
    deleteResourceByUrl,
    deleteAllVideos
} = require("./middlewares/uploadMiddleware"); // Middlewares pour les uploads

const app = express();

// Configurer la confiance aux proxys pour traiter correctement les en-têtes 'X-Forwarded-For'
app.set('trust proxy', 1);

// Utiliser la compression pour optimiser les performances
app.use(compression());

// Port d'écoute du serveur
const PORT = process.env.PORT || 9000;

// Connexion à la base de données
connectDB();

// Configuration CORS
app.use(cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN, // Autoriser les origines spécifiques définies dans .env
    optionsSuccessStatus: 200, // Pour compatibilité avec d'anciens navigateurs
}));

// Middleware pour traiter les requêtes JSON et les données URL-encodées
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers téléchargés depuis le répertoire 'uploads'
app.use("/uploads", express.static("uploads"));

// Route d'accueil
app.get("/", (req, res) => {
    res.send("WELCOME TO SALON APP API REST FULL :)");
});

// Routes API version 1
app.use("/api/v1", apiRouter);

// Route pour le téléchargement de fichiers avec Cloudinary
app.post('/upload', upload.single('file'), uploadToCloudinary, (req, res) => {
    res.status(200).send({ url: req.file.cloudinaryUrl }); // Réponse avec l'URL du fichier téléchargé
});

// Route pour récupérer toutes les ressources de Cloudinary (images, vidéos, documents)
app.get('/cloud', getAllCloudinaryData);

// Route pour supprimer une ressource de Cloudinary via son URL
app.delete('/delete', deleteResourceByUrl);

// Route pour supprimer toutes les vidéos
app.delete('/delete-all-videos', deleteAllVideos);

// Ajouter une route de ping pour garder l'instance éveillée
app.get('/ping', (_req, res) => {
    res.status(200).send('Serveur actif');
});

// Middleware global pour la gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack); // Log de l'erreur pour le débogage
    res.status(500).send("Une erreur est survenue !"); // Réponse d'erreur générique
});

// Démarrer le serveur
app.listen(PORT, () => {
    const baseLink = process.env.BASE_LINK || `http://localhost:${PORT}`;
    console.log(`Serveur écoute sur ${baseLink}`);

    /* Garder l'instance éveillée avec des requêtes de ping toutes les 5 minutes
    if (baseLink && process.env.NODE_ENV === "production") { */
        setInterval(() => {
            axios.get(`https://coworkingapp-jaqx.onrender.com`)
                .then(() => {
                    console.log('Ping réussi pour garder l\'instance éveillée');
                })
                .catch((error) => {
                    console.error('Erreur lors du ping :', error);
                });
        }, 150000); // 300000 ms = 5 minutes
   /* }*/
});

module.exports = app;
