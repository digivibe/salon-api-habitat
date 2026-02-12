require('dotenv').config()
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const Salon = require('../models/Salon')
const Categorie = require('../models/Categorie')
const Exposant = require('../models/Exposant')
const ExposantVideo = require('../models/ExposantVideo')
const ExposantBondeal = require('../models/ExposantBondeal')

// Chemins des fichiers CSV
const CSV_DIR = path.join(__dirname, '../../migration/csv')
const SALONS_CSV = path.join(CSV_DIR, 'salons.csv')
const CATEGORIES_CSV = path.join(CSV_DIR, 'categories.csv')
const EXPOSANTS_CSV = path.join(CSV_DIR, 'exposants.csv')
const VIDEOS_CSV = path.join(CSV_DIR, 'videos.csv')
const BONDEALS_CSV = path.join(CSV_DIR, 'bondeals.csv')

// Fonction pour parser un fichier CSV
function parseCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
            return []
        }
        
        // Extraire les en-têtes
        const headers = lines[0].split(',').map(h => h.trim())
        
        // Parser les lignes
        const data = []
        for (let i = 1; i < lines.length; i++) {
            const values = []
            let currentValue = ''
            let inQuotes = false
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j]
                
                if (char === '"') {
                    if (inQuotes && lines[i][j + 1] === '"') {
                        currentValue += '"'
                        j++ // Skip next quote
                    } else {
                        inQuotes = !inQuotes
                    }
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim())
                    currentValue = ''
                } else {
                    currentValue += char
                }
            }
            values.push(currentValue.trim()) // Add last value
            
            if (values.length === headers.length) {
                const obj = {}
                headers.forEach((header, index) => {
                    obj[header] = values[index] || ''
                })
                data.push(obj)
            }
        }
        
        return data
    } catch (error) {
        console.error(`Erreur lors de la lecture de ${filePath}:`, error.message)
        return []
    }
}

// Fonction principale d'importation
async function importFromCSV() {
    try {
        // Connexion à la base de données
        console.log('🔌 Connexion à la base de données...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connecté à la base de données\n')

        // Nettoyer les collections existantes (optionnel)
        const clearData = process.argv.includes('--clear')
        if (clearData) {
            console.log('🗑️  Nettoyage des données existantes (sauf événements)...')
            await Salon.deleteMany({})
            await Categorie.deleteMany({})
            await Exposant.deleteMany({})
            await ExposantVideo.deleteMany({})
            await ExposantBondeal.deleteMany({})
            console.log('✅ Données nettoyées\n')
        }

        const summary = {
            salons: 0,
            categories: 0,
            exposants: 0,
            videos: 0,
            bondeals: 0
        }

        // 1. Importer les salons
        console.log('📋 Importation des salons...')
        const salonsData = parseCSV(SALONS_CSV)
        const salonMap = new Map() // Map: nom du salon CSV -> ID du salon dans la DB
        
        for (const salonRow of salonsData) {
            const salonName = salonRow.Salon || salonRow['Salon']
            const salonNom = salonRow.Nom || salonRow['Nom']
            const isActive = salonRow.isActive === 'true' || salonRow.isActive === true
            
            if (!salonName || !salonNom) {
                console.log(`   ⚠️  Ligne de salon invalide ignorée: ${JSON.stringify(salonRow)}`)
                continue
            }
            
            let salon = await Salon.findOne({ nom: salonName })
            if (!salon) {
                salon = await Salon.create({
                    nom: salonName,
                    description: salonNom,
                    isActive: isActive,
                    statut: 1
                })
                console.log(`   ✅ Salon créé: ${salon.nom}`)
                summary.salons++
            } else {
                // Mettre à jour le salon existant
                salon.description = salonNom
                salon.isActive = isActive
                await salon.save()
                console.log(`   ⏭️  Salon "${salon.nom}" mis à jour`)
            }
            
            salonMap.set(salonName, salon._id)
        }
        console.log(`✅ ${salonsData.length} salons traités\n`)

        // 2. Importer les catégories
        console.log('📋 Importation des catégories...')
        const categoriesData = parseCSV(CATEGORIES_CSV)
        const categoryMap = new Map() // Map: "salonName|label" -> ID de la catégorie
        
        for (const catRow of categoriesData) {
            const salonName = catRow.Salon || catRow['Salon']
            const label = catRow.Label || catRow['Label']
            const color = catRow.Color || catRow['Color']
            const borderColor = catRow.BorderColor || catRow['BorderColor']
            const statut = parseInt(catRow.Statut || catRow['Statut'] || '1')
            
            if (!salonName || !label || !color || !borderColor) {
                console.log(`   ⚠️  Ligne de catégorie invalide ignorée: ${JSON.stringify(catRow)}`)
                continue
            }
            
            const salonId = salonMap.get(salonName)
            if (!salonId) {
                console.log(`   ⚠️  Salon "${salonName}" introuvable pour la catégorie "${label}"`)
                continue
            }
            
            let categorie = await Categorie.findOne({ salon: salonId, label: label })
            if (!categorie) {
                categorie = await Categorie.create({
                    salon: salonId,
                    label: label,
                    color: color,
                    borderColor: borderColor,
                    statut: statut
                })
                console.log(`   ✅ Catégorie créée: ${label} (${salonName})`)
                summary.categories++
            } else {
                console.log(`   ⏭️  Catégorie "${label}" existe déjà pour ${salonName}`)
            }
            
            categoryMap.set(`${salonName}|${label}`, categorie._id)
        }
        console.log(`✅ ${categoriesData.length} catégories traitées\n`)

        // 3. Importer les exposants
        console.log('📋 Importation des exposants...')
        const exposantsData = parseCSV(EXPOSANTS_CSV)
        const exposantMap = new Map() // Map: "salonName|email" -> ID de l'exposant
        
        for (const expRow of exposantsData) {
            const salonName = expRow.Salon || expRow['Salon']
            const email = expRow.Email || expRow['Email']
            const username = expRow.Username || expRow['Username'] || email
            const nom = expRow.Nom || expRow['Nom']
            const categorieLabel = expRow.Categorie || expRow['Categorie']
            const location = expRow.Location || expRow['Location'] || ''
            const bio = expRow.Bio || expRow['Bio'] || ''
            const isValid = parseInt(expRow.isValid || expRow['isValid'] || '2')
            const phoneNumber = expRow.PhoneNumber || expRow['PhoneNumber'] || ''
            const linkedinLink = expRow.LinkedIn || expRow['LinkedIn'] || ''
            const facebookLink = expRow.Facebook || expRow['Facebook'] || ''
            const instaLink = expRow.Instagram || expRow['Instagram'] || ''
            const weblink = expRow.Weblink || expRow['Weblink'] || ''
            const profil = expRow.Profil || expRow['Profil'] || ''
            const cover = expRow.Cover || expRow['Cover'] || ''
            const statut = parseInt(expRow.Statut || expRow['Statut'] || '1')
            
            if (!salonName || !email || !nom || !categorieLabel) {
                console.log(`   ⚠️  Ligne d'exposant invalide ignorée: ${JSON.stringify(expRow)}`)
                continue
            }
            
            const salonId = salonMap.get(salonName)
            if (!salonId) {
                console.log(`   ⚠️  Salon "${salonName}" introuvable pour l'exposant "${nom}"`)
                continue
            }
            
            const categorieId = categoryMap.get(`${salonName}|${categorieLabel}`)
            if (!categorieId) {
                console.log(`   ⚠️  Catégorie "${categorieLabel}" introuvable pour l'exposant "${nom}"`)
                continue
            }
            
            let exposant = await Exposant.findOne({ salon: salonId, email: email })
            
            // Générer un mot de passe par défaut (hashé)
            const defaultPassword = await bcrypt.hash('password123', 10)
            
            if (!exposant) {
                // Créer l'exposant avec updateOne pour éviter le hook de hashage
                await Exposant.updateOne(
                    { salon: salonId, email: email },
                    {
                        $setOnInsert: {
                            salon: salonId,
                            categorie: categorieId,
                            email: email,
                            username: username,
                            password: defaultPassword,
                            nom: nom,
                            location: location,
                            bio: bio,
                            isValid: isValid,
                            phoneNumber: phoneNumber,
                            linkedinLink: linkedinLink,
                            facebookLink: facebookLink,
                            instaLink: instaLink,
                            weblink: weblink,
                            profil: profil || '',
                            cover: cover || '',
                            statut: statut
                        }
                    },
                    { upsert: true }
                )
                exposant = await Exposant.findOne({ salon: salonId, email: email })
                console.log(`   ✅ Exposant créé: ${exposant.nom}`)
                summary.exposants++
            } else {
                console.log(`   ⏭️  Exposant "${nom}" existe déjà`)
            }
            
            exposantMap.set(`${salonName}|${email}`, exposant._id)
        }
        console.log(`✅ ${exposantsData.length} exposants traités\n`)

        // 4. Importer les vidéos
        console.log('📋 Importation des vidéos...')
        const videosData = parseCSV(VIDEOS_CSV)
        
        for (const vidRow of videosData) {
            const salonName = vidRow.Salon || vidRow['Salon']
            const exposantEmail = vidRow.ExposantEmail || vidRow['ExposantEmail']
            const name = vidRow.Name || vidRow['Name']
            const description = vidRow.Description || vidRow['Description'] || ''
            const statut = parseInt(vidRow.Statut || vidRow['Statut'] || '1')
            
            if (!salonName || !exposantEmail || !name) {
                console.log(`   ⚠️  Ligne de vidéo invalide ignorée: ${JSON.stringify(vidRow)}`)
                continue
            }
            
            const salonId = salonMap.get(salonName)
            if (!salonId) {
                console.log(`   ⚠️  Salon "${salonName}" introuvable pour la vidéo`)
                continue
            }
            
            const exposantId = exposantMap.get(`${salonName}|${exposantEmail}`)
            if (!exposantId) {
                console.log(`   ⚠️  Exposant "${exposantEmail}" introuvable pour la vidéo "${name}"`)
                continue
            }
            
            // Dans les CSV, le champ 'name' contient l'URL de la vidéo
            const videoUrl = name
            
            const existingVideo = await ExposantVideo.findOne({
                salon: salonId,
                exposantId: exposantId,
                videoUrl: videoUrl
            })
            
            if (!existingVideo) {
                await ExposantVideo.create({
                    salon: salonId,
                    exposantId: exposantId,
                    name: name,
                    description: description,
                    videoUrl: videoUrl,
                    thumbnailUrl: '',
                    statut: statut
                })
                summary.videos++
            }
        }
        console.log(`✅ ${videosData.length} vidéos traitées\n`)

        // 5. Importer les bon deals
        console.log('📋 Importation des bon deals...')
        const bondealsData = parseCSV(BONDEALS_CSV)
        
        for (const bdRow of bondealsData) {
            const salonName = bdRow.Salon || bdRow['Salon']
            const exposantEmail = bdRow.ExposantEmail || bdRow['ExposantEmail']
            const title = bdRow.Title || bdRow['Title']
            const description = bdRow.Description || bdRow['Description'] || ''
            const image = bdRow.Image || bdRow['Image'] || ''
            const statut = parseInt(bdRow.Statut || bdRow['Statut'] || '1')
            
            if (!salonName || !title || !image) {
                console.log(`   ⚠️  Ligne de bon deal invalide ignorée: ${JSON.stringify(bdRow)}`)
                continue
            }
            
            const salonId = salonMap.get(salonName)
            if (!salonId) {
                console.log(`   ⚠️  Salon "${salonName}" introuvable pour le bon deal`)
                continue
            }
            
            // Si l'email est "N/A", on ne peut pas associer le bon deal
            if (exposantEmail === 'N/A' || !exposantEmail) {
                console.log(`   ⚠️  Exposant "N/A" pour le bon deal "${title}", ignoré`)
                continue
            }
            
            const exposantId = exposantMap.get(`${salonName}|${exposantEmail}`)
            if (!exposantId) {
                console.log(`   ⚠️  Exposant "${exposantEmail}" introuvable pour le bon deal "${title}"`)
                continue
            }
            
            const existingBondeal = await ExposantBondeal.findOne({
                salon: salonId,
                exposantId: exposantId,
                title: title,
                image: image
            })
            
            if (!existingBondeal) {
                await ExposantBondeal.create({
                    salon: salonId,
                    exposantId: exposantId,
                    image: image,
                    title: title,
                    description: description,
                    statut: statut
                })
                summary.bondeals++
            }
        }
        console.log(`✅ ${bondealsData.length} bon deals traités\n`)

        // Résumé final
        console.log('\n' + '='.repeat(50))
        console.log('📊 Résumé de l\'importation:')
        console.log('='.repeat(50))
        console.log(`   Salons: ${summary.salons}`)
        console.log(`   Catégories: ${summary.categories}`)
        console.log(`   Exposants: ${summary.exposants}`)
        console.log(`   Vidéos: ${summary.videos}`)
        console.log(`   Bon deals: ${summary.bondeals}`)
        console.log('='.repeat(50) + '\n')

        console.log('✅ Import terminé avec succès!')
        console.log('\n💡 Note: Tous les exposants ont le mot de passe "password123" par défaut')
        console.log('💡 Utilisez --clear pour nettoyer les données avant l\'import\n')

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error)
        throw error
    } finally {
        await mongoose.connection.close()
        console.log('🔌 Connexion fermée')
    }
}

// Exécuter l'import
if (require.main === module) {
    importFromCSV()
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

module.exports = importFromCSV

