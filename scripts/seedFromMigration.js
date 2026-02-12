require('dotenv').config()
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

const Salon = require('../models/Salon')
const Categorie = require('../models/Categorie')
const Exposant = require('../models/Exposant')
const ExposantVideo = require('../models/ExposantVideo')
const ExposantBondeal = require('../models/ExposantBondeal')

// Chemins des fichiers JSON de migration
const MIGRATION_FILES = [
    { file: path.join(__dirname, '../../migration/habitat.json'), salonName: 'HABITAT' },
    { file: path.join(__dirname, '../../migration/emploi.json'), salonName: 'EMPLOI' },
    { file: path.join(__dirname, '../../migration/noel.json'), salonName: 'NOEL' }
]

// Fonction pour charger un fichier JSON
function loadMigrationFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message)
        throw error
    }
}

// Fonction principale de seed
async function seedFromMigration() {
    try {
        // Connexion à la base de données
        console.log('🔌 Connexion à la base de données...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connecté à la base de données\n')

        // Nettoyer les collections existantes (optionnel)
        const clearData = process.argv.includes('--clear')
        if (clearData) {
            console.log('🗑️  Nettoyage des données existantes...')
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

        // Traiter chaque fichier de migration
        for (const migrationFile of MIGRATION_FILES) {
            console.log(`\n${'='.repeat(50)}`)
            console.log(`📦 Traitement du salon: ${migrationFile.salonName}`)
            console.log(`${'='.repeat(50)}\n`)

            // Charger les données JSON
            const jsonData = loadMigrationFile(migrationFile.file)
            const collections = jsonData.collections

            // 1. Créer ou récupérer le salon
            console.log(`📋 Création/récupération du salon "${migrationFile.salonName}"...`)
            let salon = await Salon.findOne({ nom: migrationFile.salonName })
            if (!salon) {
                salon = await Salon.create({
                    nom: migrationFile.salonName,
                    description: `Salon ${migrationFile.salonName}`,
                    isActive: true,
                    statut: 1
                })
                console.log(`   ✅ Salon créé: ${salon.nom}`)
                summary.salons++
            } else {
                console.log(`   ⏭️  Salon "${salon.nom}" existe déjà`)
            }

            // 2. Créer les catégories (ignorer pour NOEL)
            const oldToNewCategoryMap = new Map() // Map: ancien ID -> nouveau ID
            
            if (migrationFile.salonName === 'NOEL') {
                console.log(`\n📋 Ignorant les catégories pour ${salon.nom} (normal pour NOEL)...`)
                console.log(`✅ Aucune catégorie créée pour NOEL`)
            } else {
                console.log(`\n📋 Création des catégories pour ${salon.nom}...`)
                
                if (collections.categories && collections.categories.data) {
                    for (const oldCategory of collections.categories.data) {
                        // Vérifier si la catégorie existe déjà pour ce salon
                        let categorie = await Categorie.findOne({ 
                            salon: salon._id, 
                            label: oldCategory.label 
                        })
                        
                        if (!categorie) {
                            categorie = await Categorie.create({
                                salon: salon._id,
                                label: oldCategory.label,
                                color: oldCategory.color,
                                borderColor: oldCategory.borderColor,
                                statut: oldCategory.statut || 1
                            })
                            console.log(`   ✅ Catégorie créée: ${categorie.label}`)
                            summary.categories++
                        } else {
                            console.log(`   ⏭️  Catégorie "${categorie.label}" existe déjà`)
                        }
                        
                        // Mapper l'ancien ID vers le nouveau
                        oldToNewCategoryMap.set(oldCategory._id, categorie._id)
                    }
                }
                console.log(`✅ ${collections.categories?.count || 0} catégories traitées`)
            }

            // 3. Créer les exposants (ignorer pour NOEL)
            const oldToNewExposantMap = new Map() // Map: ancien ID -> nouveau ID
            
            if (migrationFile.salonName === 'NOEL') {
                console.log(`\n📋 Ignorant les exposants pour ${salon.nom} (normal pour NOEL)...`)
                console.log(`✅ Aucun exposant créé pour NOEL`)
            } else {
                console.log(`\n📋 Création des exposants pour ${salon.nom}...`)
                
                if (collections.exposants && collections.exposants.data) {
                for (const oldExposant of collections.exposants.data) {
                    // Vérifier si l'exposant existe déjà (par email dans ce salon)
                    let exposant = await Exposant.findOne({ 
                        salon: salon._id, 
                        email: oldExposant.email 
                    })
                    
                    if (!exposant) {
                        // Trouver la nouvelle catégorie correspondante
                        const newCategoryId = oldToNewCategoryMap.get(oldExposant.categorie)
                        if (!newCategoryId) {
                            console.log(`   ⚠️  Catégorie introuvable pour l'exposant "${oldExposant.nom}", ignoré`)
                            continue
                        }

                        // Vérifier si le mot de passe est déjà hashé (commence par $2a$ ou $2b$)
                        const isPasswordHashed = oldExposant.password && 
                            (oldExposant.password.startsWith('$2a$') || oldExposant.password.startsWith('$2b$'))

                        const exposantData = {
                            salon: salon._id,
                            categorie: newCategoryId,
                            email: oldExposant.email,
                            username: oldExposant.username || oldExposant.email,
                            password: oldExposant.password,
                            nom: oldExposant.nom,
                            profil: oldExposant.profil || '',
                            cover: oldExposant.cover || '',
                            location: oldExposant.location || '',
                            bio: oldExposant.bio || '',
                            isValid: oldExposant.isValid !== undefined ? oldExposant.isValid : 2,
                            phoneNumber: oldExposant.phoneNumber || '',
                            linkedinLink: oldExposant.linkedinLink || '',
                            facebookLink: oldExposant.facebookLink || '',
                            instaLink: oldExposant.instaLink || '',
                            weblink: oldExposant.weblink || '',
                            statut: oldExposant.statut !== undefined ? oldExposant.statut : 1
                        }

                        if (isPasswordHashed) {
                            // Si le mot de passe est déjà hashé, utiliser updateOne avec upsert pour éviter le hook pre-save
                            const result = await Exposant.updateOne(
                                { salon: salon._id, email: oldExposant.email },
                                { $setOnInsert: exposantData },
                                { upsert: true }
                            )
                            exposant = await Exposant.findOne({ salon: salon._id, email: oldExposant.email })
                        } else {
                            // Si le mot de passe n'est pas hashé, utiliser create (le hook le hashra)
                            exposant = await Exposant.create(exposantData)
                        }
                        console.log(`   ✅ Exposant créé: ${exposant.nom}`)
                        summary.exposants++
                    } else {
                        console.log(`   ⏭️  Exposant "${oldExposant.nom}" existe déjà`)
                    }
                    
                    // Mapper l'ancien ID vers le nouveau
                    oldToNewExposantMap.set(oldExposant._id, exposant._id)
                }
                }
                console.log(`✅ ${collections.exposants?.count || 0} exposants traités`)
            }

            // 4. Créer les vidéos des exposants (ignorer pour NOEL)
            if (migrationFile.salonName === 'NOEL') {
                console.log(`\n📋 Ignorant les vidéos pour ${salon.nom} (normal pour NOEL)...`)
                console.log(`✅ Aucune vidéo créée pour NOEL`)
            } else {
                console.log(`\n📋 Création des vidéos pour ${salon.nom}...`)
                
                if (collections.exposantvideos && collections.exposantvideos.data) {
                for (const oldVideo of collections.exposantvideos.data) {
                    // Trouver le nouvel ID de l'exposant
                    const newExposantId = oldToNewExposantMap.get(oldVideo.exposantId)
                    if (!newExposantId) {
                        console.log(`   ⚠️  Exposant introuvable pour la vidéo "${oldVideo.name}", ignorée`)
                        continue
                    }

                    // Dans les JSON, le champ 'name' contient l'URL de la vidéo
                    const videoUrl = oldVideo.videoUrl || oldVideo.name || ''
                    
                    // Vérifier si la vidéo existe déjà
                    const existingVideo = await ExposantVideo.findOne({
                        salon: salon._id,
                        exposantId: newExposantId,
                        videoUrl: videoUrl
                    })

                    if (!existingVideo) {
                        const videoName = oldVideo.name || 'Vidéo'
                        
                        await ExposantVideo.create({
                            salon: salon._id,
                            exposantId: newExposantId,
                            name: videoName,
                            description: oldVideo.description || '',
                            videoUrl: videoUrl,
                            thumbnailUrl: oldVideo.thumbnailUrl || '',
                            statut: oldVideo.statut !== undefined ? oldVideo.statut : 1
                        })
                        summary.videos++
                    }
                }
                }
                console.log(`✅ ${collections.exposantvideos?.count || 0} vidéos traitées`)
            }

            // 5. Créer les bon deals des exposants (ignorer pour NOEL)
            if (migrationFile.salonName === 'NOEL') {
                console.log(`\n📋 Ignorant les bon deals pour ${salon.nom} (normal pour NOEL)...`)
                console.log(`✅ Aucun bon deal créé pour NOEL`)
            } else {
                console.log(`\n📋 Création des bon deals pour ${salon.nom}...`)
                
                if (collections.exposantbondeals && collections.exposantbondeals.data) {
                for (const oldBondeal of collections.exposantbondeals.data) {
                    // Trouver le nouvel ID de l'exposant
                    const newExposantId = oldToNewExposantMap.get(oldBondeal.exposantId)
                    if (!newExposantId) {
                        console.log(`   ⚠️  Exposant introuvable pour le bon deal "${oldBondeal.title}", ignoré`)
                        continue
                    }

                    // Vérifier si le bon deal existe déjà
                    const existingBondeal = await ExposantBondeal.findOne({
                        salon: salon._id,
                        exposantId: newExposantId,
                        title: oldBondeal.title,
                        image: oldBondeal.image
                    })

                    if (!existingBondeal) {
                        await ExposantBondeal.create({
                            salon: salon._id,
                            exposantId: newExposantId,
                            image: oldBondeal.image || '',
                            title: oldBondeal.title || '',
                            description: oldBondeal.description || '',
                            statut: oldBondeal.statut !== undefined ? oldBondeal.statut : 1
                        })
                        summary.bondeals++
                    }
                }
                }
                console.log(`✅ ${collections.exposantbondeals?.count || 0} bon deals traités`)
            }
        }

        // Résumé final
        console.log('\n' + '='.repeat(50))
        console.log('📊 Résumé des données importées:')
        console.log('='.repeat(50))
        console.log(`   Salons: ${summary.salons}`)
        console.log(`   Catégories: ${summary.categories}`)
        console.log(`   Exposants: ${summary.exposants}`)
        console.log(`   Vidéos: ${summary.videos}`)
        console.log(`   Bon deals: ${summary.bondeals}`)
        console.log('='.repeat(50) + '\n')

        console.log('✅ Import terminé avec succès!')
        console.log('\n💡 Note: Les mots de passe des exposants ont été conservés tels quels')
        console.log('💡 Utilisez --clear pour nettoyer les données avant l\'import\n')

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error)
        throw error
    } finally {
        await mongoose.connection.close()
        console.log('🔌 Connexion fermée')
    }
}

// Exécuter le seed
if (require.main === module) {
    seedFromMigration()
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

module.exports = seedFromMigration

