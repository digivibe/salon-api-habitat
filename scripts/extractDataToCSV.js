require('dotenv').config()
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Configuration des 3 anciens serveurs
const OLD_SERVERS = [
    {
        name: 'HABITAT',
        mongoUri: process.env.OLD_HABITAT_MONGO_URI || 'mongodb://localhost:27017/salonapp',
        modelsPath: path.join(__dirname, '../../old/salonapp-api-habitat/models')
    },
    {
        name: 'EMPLOI',
        mongoUri: process.env.OLD_EMPLOI_MONGO_URI || 'mongodb://localhost:27017/salonapp-formation',
        modelsPath: path.join(__dirname, '../../old/salonapp-api-formation/models')
    },
    {
        name: 'NOEL',
        mongoUri: process.env.OLD_NOEL_MONGO_URI || 'mongodb://localhost:27017/salonapp-noel',
        modelsPath: path.join(__dirname, '../../old/salonapp-api-noel/models')
    }
]

// Fonction pour charger les modèles d'un ancien serveur avec une connexion mongoose
function loadOldModels(modelsPath, connection) {
    // Créer les schémas avec la connexion spécifique
    const mongoose = require('mongoose')
    
    // Salon
    const salonSchema = new mongoose.Schema({
        nom: { type: String, required: true },
        isActive: { type: Boolean, default: false }
    }, { timestamps: true })
    const Salon = connection.model('Salon', salonSchema)
    
    // Categorie
    const categorieSchema = new mongoose.Schema({
        color: { type: String, required: true, maxlength: 7 },
        borderColor: { type: String, required: true, maxlength: 7 },
        label: { type: String, required: true, unique: true, maxlength: 100 },
        statut: { type: Number, enum: [0, 1], default: 1 }
    }, { collection: 'categories' })
    const Categorie = connection.model('Categorie', categorieSchema)
    
    // Exposant
    const exposantSchema = new mongoose.Schema({
        categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie', required: true },
        email: { type: String, required: true, unique: true, trim: true, maxlength: 256 },
        username: { type: String, required: true, unique: true, trim: true, maxlength: 256 },
        password: { type: String, required: true, minlength: 5, maxlength: 256 },
        nom: { type: String, required: true, trim: true, maxlength: 100 },
        profil: { type: String, required: true, maxlength: 100 },
        cover: { type: String, required: true, maxlength: 100 },
        location: { type: String, required: true, trim: true, maxlength: 256 },
        bio: { type: String, required: true, trim: true, maxlength: 256 },
        isValid: { type: Number, required: true, enum: [0, 1, 2, 3], default: 2 },
        phoneNumber: { type: String, trim: true, maxlength: 20, default: '' },
        linkedinLink: { type: String, trim: true, maxlength: 256 },
        facebookLink: { type: String, trim: true, maxlength: 256, default: '' },
        instaLink: { type: String, trim: true, maxlength: 256 },
        weblink: { type: String, trim: true, maxlength: 256, default: '' },
        statut: { type: Number, required: true, enum: [0, 1], default: 1 }
    }, { collection: 'exposants', timestamps: true })
    const Exposant = connection.model('Exposant', exposantSchema)
    
    // ExposantVideo
    const exposantVideoSchema = new mongoose.Schema({
        exposantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exposant', required: true },
        name: { type: String, required: true, unique: true, maxlength: 100 },
        description: { type: String, required: true, maxlength: 256 },
        statut: { type: Number, enum: [0, 1], default: 1 }
    }, { collection: 'exposantvideos' })
    const ExposantVideo = connection.model('ExposantVideo', exposantVideoSchema)
    
    // ExposantBondeal
    const exposantBondealSchema = new mongoose.Schema({
        exposantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exposant', required: true },
        image: { type: String, required: true, unique: true, maxlength: 200 },
        title: { type: String, required: true, unique: true, maxlength: 100 },
        description: { type: String, required: true, maxlength: 256 },
        statut: { type: Number, enum: [0, 1], default: 1 }
    }, { collection: 'exposantbondeals' })
    const ExposantBondeal = connection.model('ExposantBondeal', exposantBondealSchema)
    
    return { Salon, Categorie, Exposant, ExposantVideo, ExposantBondeal }
}

// Fonction pour échapper les valeurs CSV
function escapeCSV(value) {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

// Fonction pour extraire les données d'un serveur
async function extractServerData(server) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📦 Extraction des données: ${server.name}`)
    console.log(`${'='.repeat(60)}\n`)

    try {
        // Connexion à l'ancienne base de données
        console.log(`🔌 Connexion à la base de données ${server.name}...`)
        const mongoose = require('mongoose')
        const oldConnection = await mongoose.createConnection(server.mongoUri)
        console.log(`✅ Connecté à ${server.name}\n`)

        // Charger les modèles avec la connexion
        const { Salon, Categorie, Exposant, ExposantVideo, ExposantBondeal } = loadOldModels(server.modelsPath, oldConnection)

        // Récupérer le salon
        const salon = await Salon.findOne({}).lean()
        if (!salon) {
            console.log(`⚠️  Aucun salon trouvé pour ${server.name}`)
            await oldConnection.close()
            return {
                salon: null,
                categories: [],
                exposants: [],
                videos: [],
                bondeals: []
            }
        }

        console.log(`✅ Salon trouvé: ${salon.nom}`)

        // Récupérer les catégories
        const categories = await Categorie.find({ statut: 1 }).lean()
        console.log(`✅ ${categories.length} catégories trouvées`)

        // Récupérer les exposants
        const exposants = await Exposant.find({ statut: 1 }).lean()
        console.log(`✅ ${exposants.length} exposants trouvés`)

        // Récupérer les vidéos
        const videos = await ExposantVideo.find({ statut: 1 }).lean()
        console.log(`✅ ${videos.length} vidéos trouvées`)

        // Récupérer les bon deals
        const bondeals = await ExposantBondeal.find({ statut: 1 }).lean()
        console.log(`✅ ${bondeals.length} bon deals trouvés`)

        await oldConnection.close()

        return {
            salon: {
                nom: salon.nom,
                isActive: salon.isActive || false
            },
            categories: categories.map(cat => ({
                label: cat.label,
                color: cat.color,
                borderColor: cat.borderColor,
                statut: cat.statut
            })),
            exposants: exposants.map(exp => ({
                email: exp.email,
                username: exp.username || exp.email,
                nom: exp.nom,
                categorieLabel: categories.find(c => c._id.toString() === exp.categorie.toString())?.label || 'N/A',
                location: exp.location || '',
                bio: exp.bio || '',
                isValid: exp.isValid || 0,
                phoneNumber: exp.phoneNumber || '',
                linkedinLink: exp.linkedinLink || '',
                facebookLink: exp.facebookLink || '',
                instaLink: exp.instaLink || '',
                weblink: exp.weblink || '',
                profil: exp.profil || '',
                cover: exp.cover || '',
                statut: exp.statut || 1
            })),
            videos: videos.map(vid => ({
                exposantEmail: exposants.find(e => e._id.toString() === vid.exposantId.toString())?.email || 'N/A',
                name: vid.name || '',
                description: vid.description || '',
                statut: vid.statut || 1
            })),
            bondeals: bondeals.map(bd => ({
                exposantEmail: exposants.find(e => e._id.toString() === bd.exposantId.toString())?.email || 'N/A',
                title: bd.title || '',
                description: bd.description || '',
                image: bd.image || '',
                statut: bd.statut || 1
            }))
        }
    } catch (error) {
        console.error(`❌ Erreur lors de l'extraction de ${server.name}:`, error.message)
        return {
            salon: null,
            categories: [],
            exposants: [],
            videos: [],
            bondeals: []
        }
    }
}

// Fonction principale
async function extractDataToCSV() {
    try {
        console.log('🚀 Début de l\'extraction des données vers CSV\n')

        const allData = []

        // Extraire les données de chaque serveur
        for (const server of OLD_SERVERS) {
            const data = await extractServerData(server)
            allData.push({
                serverName: server.name,
                ...data
            })
        }

        // Générer les fichiers CSV
        const outputDir = path.join(__dirname, '../../migration/csv')
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
        }

        // CSV des salons
        const salonsCSV = ['Salon,Nom,isActive']
        allData.forEach(({ serverName, salon }) => {
            if (salon) {
                salonsCSV.push(`${serverName},${escapeCSV(salon.nom)},${salon.isActive}`)
            }
        })
        fs.writeFileSync(path.join(outputDir, 'salons.csv'), salonsCSV.join('\n'), 'utf8')
        console.log(`\n✅ Fichier créé: salons.csv`)

        // CSV des catégories
        const categoriesCSV = ['Salon,Label,Color,BorderColor,Statut']
        allData.forEach(({ serverName, categories }) => {
            categories.forEach(cat => {
                categoriesCSV.push(`${serverName},${escapeCSV(cat.label)},${escapeCSV(cat.color)},${escapeCSV(cat.borderColor)},${cat.statut}`)
            })
        })
        fs.writeFileSync(path.join(outputDir, 'categories.csv'), categoriesCSV.join('\n'), 'utf8')
        console.log(`✅ Fichier créé: categories.csv`)

        // CSV des exposants
        const exposantsCSV = ['Salon,Email,Username,Nom,Categorie,Location,Bio,isValid,PhoneNumber,LinkedIn,Facebook,Instagram,Weblink,Profil,Cover,Statut']
        allData.forEach(({ serverName, exposants }) => {
            exposants.forEach(exp => {
                exposantsCSV.push([
                    serverName,
                    escapeCSV(exp.email),
                    escapeCSV(exp.username),
                    escapeCSV(exp.nom),
                    escapeCSV(exp.categorieLabel),
                    escapeCSV(exp.location),
                    escapeCSV(exp.bio),
                    exp.isValid,
                    escapeCSV(exp.phoneNumber),
                    escapeCSV(exp.linkedinLink),
                    escapeCSV(exp.facebookLink),
                    escapeCSV(exp.instaLink),
                    escapeCSV(exp.weblink),
                    escapeCSV(exp.profil),
                    escapeCSV(exp.cover),
                    exp.statut
                ].join(','))
            })
        })
        fs.writeFileSync(path.join(outputDir, 'exposants.csv'), exposantsCSV.join('\n'), 'utf8')
        console.log(`✅ Fichier créé: exposants.csv`)

        // CSV des vidéos
        const videosCSV = ['Salon,ExposantEmail,Name,Description,Statut']
        allData.forEach(({ serverName, videos }) => {
            videos.forEach(vid => {
                videosCSV.push([
                    serverName,
                    escapeCSV(vid.exposantEmail),
                    escapeCSV(vid.name),
                    escapeCSV(vid.description),
                    vid.statut
                ].join(','))
            })
        })
        fs.writeFileSync(path.join(outputDir, 'videos.csv'), videosCSV.join('\n'), 'utf8')
        console.log(`✅ Fichier créé: videos.csv`)

        // CSV des bon deals
        const bondealsCSV = ['Salon,ExposantEmail,Title,Description,Image,Statut']
        allData.forEach(({ serverName, bondeals }) => {
            bondeals.forEach(bd => {
                bondealsCSV.push([
                    serverName,
                    escapeCSV(bd.exposantEmail),
                    escapeCSV(bd.title),
                    escapeCSV(bd.description),
                    escapeCSV(bd.image),
                    bd.statut
                ].join(','))
            })
        })
        fs.writeFileSync(path.join(outputDir, 'bondeals.csv'), bondealsCSV.join('\n'), 'utf8')
        console.log(`✅ Fichier créé: bondeals.csv`)

        // Résumé
        console.log('\n' + '='.repeat(60))
        console.log('📊 Résumé de l\'extraction:')
        console.log('='.repeat(60))
        allData.forEach(({ serverName, salon, categories, exposants, videos, bondeals }) => {
            console.log(`\n${serverName}:`)
            console.log(`   Salon: ${salon ? salon.nom : 'Aucun'}`)
            console.log(`   Catégories: ${categories.length}`)
            console.log(`   Exposants: ${exposants.length}`)
            console.log(`   Vidéos: ${videos.length}`)
            console.log(`   Bon deals: ${bondeals.length}`)
        })
        console.log('\n✅ Extraction terminée!')
        console.log(`📁 Fichiers CSV créés dans: ${outputDir}\n`)

    } catch (error) {
        console.error('❌ Erreur lors de l\'extraction:', error)
        throw error
    }
}

// Exécuter l'extraction
if (require.main === module) {
    extractDataToCSV()
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

module.exports = extractDataToCSV

