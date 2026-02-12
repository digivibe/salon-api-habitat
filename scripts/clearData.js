require('dotenv').config()
const mongoose = require('mongoose')

const Salon = require('../models/Salon')
const Categorie = require('../models/Categorie')
const Exposant = require('../models/Exposant')
const ExposantVideo = require('../models/ExposantVideo')
const ExposantBondeal = require('../models/ExposantBondeal')
const Event = require('../models/Event')

// Fonction pour nettoyer toutes les données sauf les événements
async function clearData() {
    try {
        // Connexion à la base de données
        console.log('🔌 Connexion à la base de données...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connecté à la base de données\n')

        console.log('🗑️  Nettoyage des données (sauf événements)...\n')

        // Compter avant suppression
        const salonCount = await Salon.countDocuments({})
        const categorieCount = await Categorie.countDocuments({})
        const exposantCount = await Exposant.countDocuments({})
        const videoCount = await ExposantVideo.countDocuments({})
        const bondealCount = await ExposantBondeal.countDocuments({})
        const eventCount = await Event.countDocuments({})

        console.log('📊 Données actuelles:')
        console.log(`   Salons: ${salonCount}`)
        console.log(`   Catégories: ${categorieCount}`)
        console.log(`   Exposants: ${exposantCount}`)
        console.log(`   Vidéos: ${videoCount}`)
        console.log(`   Bon deals: ${bondealCount}`)
        console.log(`   Événements: ${eventCount} (seront conservés)\n`)

        // Demander confirmation
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        })

        const answer = await new Promise((resolve) => {
            readline.question('⚠️  Êtes-vous sûr de vouloir supprimer toutes ces données ? (oui/non): ', resolve)
        })
        readline.close()

        if (answer.toLowerCase() !== 'oui') {
            console.log('❌ Opération annulée')
            await mongoose.connection.close()
            return
        }

        // Supprimer les données
        console.log('\n🗑️  Suppression en cours...\n')

        const salonResult = await Salon.deleteMany({})
        console.log(`   ✅ ${salonResult.deletedCount} salons supprimés`)

        const categorieResult = await Categorie.deleteMany({})
        console.log(`   ✅ ${categorieResult.deletedCount} catégories supprimées`)

        const exposantResult = await Exposant.deleteMany({})
        console.log(`   ✅ ${exposantResult.deletedCount} exposants supprimés`)

        const videoResult = await ExposantVideo.deleteMany({})
        console.log(`   ✅ ${videoResult.deletedCount} vidéos supprimées`)

        const bondealResult = await ExposantBondeal.deleteMany({})
        console.log(`   ✅ ${bondealResult.deletedCount} bon deals supprimés`)

        // Vérifier que les événements sont toujours là
        const remainingEventCount = await Event.countDocuments({})
        console.log(`\n   ✅ ${remainingEventCount} événements conservés`)

        console.log('\n✅ Nettoyage terminé avec succès!')

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error)
        throw error
    } finally {
        await mongoose.connection.close()
        console.log('🔌 Connexion fermée')
    }
}

// Exécuter le nettoyage
if (require.main === module) {
    clearData()
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

module.exports = clearData

