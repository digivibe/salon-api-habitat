require('dotenv').config()

const express = require('express')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const connectDB = require('./config/db')
const initAdmin = require('./config/initAdmin')
const errorHandler = require('./middlewares/errorHandler')
const apiRouter = require('./routes/index')
const {
    upload,
    uploadToCloudinary,
    getAllCloudinaryData,
    deleteResourceByUrl,
    deleteAllVideos
} = require('./middlewares/upload')

const app = express()

// Configuration de la confiance aux proxys
app.set('trust proxy', 1)

// Utiliser la compression pour optimiser les performances
app.use(compression())

// Port d'écoute du serveur
const PORT = process.env.PORT || 9000

// Connexion à la base de données
connectDB().then(async () => {
    // Initialiser l'administrateur par défaut après la connexion
    await initAdmin()
})

// Configuration CORS
const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({
    credentials: true,
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(o => o.trim()),
    optionsSuccessStatus: 200
}))

// Middleware pour traiter les requêtes JSON et les données URL-encodées
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers téléchargés depuis le répertoire 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Servir les assets statiques (images par défaut)
app.use('/assets', express.static(path.join(__dirname, 'public/assets')))

// Servir le panneau d'administration (si présent)
app.use('/manage', express.static(path.join(__dirname, 'public/manage')))
// Route pour servir index.html par défaut sur /manage
app.get('/manage', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/manage/index.html'))
})

// Route d'accueil
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Dormans API v2 - Unified Multi-Salon Backend',
        version: '2.0.0',
        api: {
            v2: '/api/v2',
            test: '/api/v2/test'
        },
        timestamp: new Date().toISOString()
    })
})

// Routes API version 2
app.use('/api/v2', apiRouter)

// Route pour le téléchargement de fichiers avec Cloudinary
app.post('/upload', upload.single('file'), uploadToCloudinary, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
            url: req.file.cloudinaryUrl,
            publicId: req.file.publicId,
            resourceType: req.file.resourceType
        }
    })
})

// Route pour récupérer toutes les ressources de Cloudinary
app.get('/cloud', getAllCloudinaryData)

// Route pour supprimer une ressource de Cloudinary via son URL
app.delete('/delete', deleteResourceByUrl)

// Route pour supprimer toutes les vidéos
app.delete('/delete-all-videos', deleteAllVideos)

// Route de ping pour garder l'instance éveillée
app.get('/ping', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is active',
        timestamp: new Date().toISOString()
    })
})

// Middleware global pour la gestion des erreurs (doit être après toutes les routes)
app.use(errorHandler)

// Gestion des routes non trouvées
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    })
})

// Démarrer le serveur
app.listen(PORT, () => {
    const baseLink = process.env.BASE_LINK || `http://localhost:${PORT}`
    console.log(`\n🚀 Server is running on ${baseLink}`)
    console.log(`📡 API v2 available at ${baseLink}/api/v2`)
    console.log(`🧪 Test endpoint: ${baseLink}/api/v2/test`)
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`)
})

module.exports = app

