require('dotenv').config()
const mongoose = require('mongoose')
const Salon = require('../models/Salon')
const Categorie = require('../models/Categorie')
const Event = require('../models/Event')
const Exposant = require('../models/Exposant')
const ExposantVideo = require('../models/ExposantVideo')
const ExposantBondeal = require('../models/ExposantBondeal')
const Comment = require('../models/Comment')
const Like = require('../models/Like')

// Données de test
const salonsData = [
    {
        nom: 'Salon Habitat',
        description: 'Salon dédié à l\'habitat et à la construction',
        statut: 1,
        isActive: true
    },
    {
        nom: 'Salon Formation',
        description: 'Salon dédié à la formation professionnelle',
        statut: 1,
        isActive: true
    },
    {
        nom: 'Salon Noël',
        description: 'Salon dédié aux fêtes de fin d\'année',
        statut: 1,
        isActive: true
    }
]

const categoriesData = [
    { label: 'Architecture', color: '#3B82F6', borderColor: '#1E40AF' },
    { label: 'Construction', color: '#10B981', borderColor: '#059669' },
    { label: 'Décoration', color: '#F59E0B', borderColor: '#D97706' },
    { label: 'Énergie', color: '#EF4444', borderColor: '#DC2626' },
    { label: 'Formation', color: '#8B5CF6', borderColor: '#7C3AED' },
    { label: 'Éducation', color: '#EC4899', borderColor: '#DB2777' },
    { label: 'Commerce', color: '#06B6D4', borderColor: '#0891B2' },
    { label: 'Gastronomie', color: '#F97316', borderColor: '#EA580C' }
]

const eventsData = [
    {
        titre: 'Conférence sur l\'habitat durable',
        description: 'Découvrez les dernières tendances en matière d\'habitat durable et écologique',
        eventDate: '2024-06-15',
        fullEventDate: new Date('2024-06-15')
    },
    {
        titre: 'Atelier formation professionnelle',
        description: 'Atelier pratique sur les nouvelles méthodes de formation',
        eventDate: '2024-07-20',
        fullEventDate: new Date('2024-07-20')
    },
    {
        titre: 'Marché de Noël',
        description: 'Grand marché de Noël avec de nombreux exposants',
        eventDate: '2024-12-10',
        fullEventDate: new Date('2024-12-10')
    }
]

// Noms d'exposants de test
const exposantsNames = [
    'BTP Construction', 'Architecte Pro', 'Décoration Plus', 'Énergie Solaire',
    'Formation Expert', 'École Pro', 'Commerce Direct', 'Restaurant Le Gourmet',
    'Maison Moderne', 'Habitat Éco', 'Bâtiment Plus', 'Design Intérieur',
    'Énergie Verte', 'Formation Pro', 'École Supérieure', 'Boutique Mode',
    'Cuisine Deluxe', 'Construction Moderne', 'Architecture Design', 'Décoration Style'
]

// Fonction pour générer un email
function generateEmail(nom) {
    const slug = nom.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return `${slug}@test.com`
}

// Fonction pour générer une bio
function generateBio(nom) {
    const bios = [
        `Expert en ${nom.toLowerCase()}, nous offrons des services de qualité depuis plus de 10 ans.`,
        `Spécialiste dans le domaine de ${nom.toLowerCase()}, notre équipe est à votre service.`,
        `Leader dans ${nom.toLowerCase()}, nous proposons des solutions innovantes et durables.`,
        `Depuis 2010, ${nom} est votre partenaire de confiance pour tous vos projets.`
    ]
    return bios[Math.floor(Math.random() * bios.length)]
}

// Fonction pour générer une localisation
function generateLocation() {
    const locations = [
        'Paris, France',
        'Lyon, France',
        'Marseille, France',
        'Toulouse, France',
        'Nice, France',
        'Nantes, France',
        'Strasbourg, France',
        'Montpellier, France'
    ]
    return locations[Math.floor(Math.random() * locations.length)]
}

// Fonction pour générer un numéro de téléphone
function generatePhone() {
    return `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
}

// Fonction principale de seed
async function seed() {
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
            await Event.deleteMany({})
            await Exposant.deleteMany({})
            await ExposantVideo.deleteMany({})
            await ExposantBondeal.deleteMany({})
            await Comment.deleteMany({})
            await Like.deleteMany({})
            console.log('✅ Données nettoyées\n')
        }

        // Créer les salons
        console.log('📋 Création des salons...')
        const salons = []
        for (const salonData of salonsData) {
            const existingSalon = await Salon.findOne({ nom: salonData.nom })
            if (existingSalon) {
                console.log(`   ⏭️  Salon "${salonData.nom}" existe déjà`)
                salons.push(existingSalon)
            } else {
                const salon = await Salon.create(salonData)
                console.log(`   ✅ Salon créé: ${salon.nom}`)
                salons.push(salon)
            }
        }
        console.log(`✅ ${salons.length} salons créés\n`)

        // Créer les catégories
        console.log('📋 Création des catégories...')
        const categories = []
        for (const salon of salons) {
            const salonCategories = categoriesData.slice(0, Math.floor(categoriesData.length / salons.length) + 1)
            for (const catData of salonCategories) {
                const existingCat = await Categorie.findOne({ salon: salon._id, label: catData.label })
                if (existingCat) {
                    console.log(`   ⏭️  Catégorie "${catData.label}" existe déjà pour ${salon.nom}`)
                    categories.push(existingCat)
                } else {
                    const categorie = await Categorie.create({
                        salon: salon._id,
                        ...catData,
                        statut: 1
                    })
                    console.log(`   ✅ Catégorie créée: ${categorie.label} (${salon.nom})`)
                    categories.push(categorie)
                }
            }
        }
        console.log(`✅ ${categories.length} catégories créées\n`)

        // Créer les événements
        console.log('📋 Création des événements...')
        const events = []
        for (let i = 0; i < salons.length && i < eventsData.length; i++) {
            const eventData = eventsData[i]
            const existingEvent = await Event.findOne({ salon: salons[i]._id, titre: eventData.titre })
            if (existingEvent) {
                console.log(`   ⏭️  Événement "${eventData.titre}" existe déjà`)
                events.push(existingEvent)
            } else {
                const event = await Event.create({
                    salon: salons[i]._id,
                    ...eventData,
                    statut: 1
                })
                console.log(`   ✅ Événement créé: ${event.titre} (${salons[i].nom})`)
                events.push(event)
            }
        }
        console.log(`✅ ${events.length} événements créés\n`)

        // Créer les exposants
        console.log('📋 Création des exposants...')
        const exposants = []
        let exposantIndex = 0
        
        for (const salon of salons) {
            const salonCategories = categories.filter(cat => cat.salon.toString() === salon._id.toString())
            const exposantsPerSalon = Math.floor(exposantsNames.length / salons.length) + 2
            
            for (let i = 0; i < exposantsPerSalon && exposantIndex < exposantsNames.length; i++) {
                const nom = exposantsNames[exposantIndex]
                const email = generateEmail(nom)
                const existingExposant = await Exposant.findOne({ email })
                
                if (existingExposant) {
                    console.log(`   ⏭️  Exposant "${nom}" existe déjà`)
                    exposants.push(existingExposant)
                } else {
                    const categorie = salonCategories[Math.floor(Math.random() * salonCategories.length)]
                    const isValid = Math.random() > 0.7 ? 3 : (Math.random() > 0.5 ? 2 : (Math.random() > 0.3 ? 1 : 0))
                    
                    const exposant = await Exposant.create({
                        salon: salon._id,
                        categorie: categorie._id,
                        email,
                        username: email,
                        password: 'password123', // Mot de passe par défaut
                        nom,
                        location: generateLocation(),
                        bio: generateBio(nom),
                        phoneNumber: generatePhone(),
                        weblink: `https://www.${generateEmail(nom).split('@')[0]}.com`,
                        linkedinLink: `https://linkedin.com/company/${generateEmail(nom).split('@')[0]}`,
                        facebookLink: `https://facebook.com/${generateEmail(nom).split('@')[0]}`,
                        instaLink: `https://instagram.com/${generateEmail(nom).split('@')[0]}`,
                        isValid,
                        statut: Math.random() > 0.1 ? 1 : 0 // 90% actifs
                    })
                    console.log(`   ✅ Exposant créé: ${exposant.nom} (${salon.nom})`)
                    exposants.push(exposant)
                }
                exposantIndex++
            }
        }
        console.log(`✅ ${exposants.length} exposants créés\n`)

        // Créer des vidéos pour certains exposants
        console.log('📋 Création des vidéos...')
        let videoCount = 0
        for (const exposant of exposants.slice(0, Math.floor(exposants.length * 0.7))) {
            const videoCountPerExposant = Math.floor(Math.random() * 3) + 1
            for (let i = 0; i < videoCountPerExposant; i++) {
                await ExposantVideo.create({
                    salon: exposant.salon,
                    exposantId: exposant._id,
                    name: `Vidéo ${i + 1} - ${exposant.nom}`,
                    description: `Description de la vidéo ${i + 1} de ${exposant.nom}`,
                    videoUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'test'}/video/upload/v1/test/video${videoCount}.mp4`,
                    thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'test'}/image/upload/v1/test/thumb${videoCount}.jpg`,
                    statut: 1
                })
                videoCount++
            }
        }
        console.log(`✅ ${videoCount} vidéos créées\n`)

        // Créer des bondeals pour certains exposants
        console.log('📋 Création des bondeals...')
        let bondealCount = 0
        for (const exposant of exposants.slice(0, Math.floor(exposants.length * 0.5))) {
            const bondealCountPerExposant = Math.floor(Math.random() * 2) + 1
            for (let i = 0; i < bondealCountPerExposant; i++) {
                await ExposantBondeal.create({
                    salon: exposant.salon,
                    exposantId: exposant._id,
                    title: `Offre spéciale ${i + 1} - ${exposant.nom}`,
                    description: `Description de l'offre spéciale ${i + 1} de ${exposant.nom}`,
                    image: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'test'}/image/upload/v1/test/bondeal${bondealCount}.jpg`,
                    statut: 1
                })
                bondealCount++
            }
        }
        console.log(`✅ ${bondealCount} bondeals créés\n`)

        // Créer des commentaires et likes (optionnel)
        console.log('📋 Création des interactions (commentaires, likes)...')
        const videos = await ExposantVideo.find({})
        let commentCount = 0
        let likeCount = 0

        for (const video of videos.slice(0, Math.floor(videos.length * 0.8))) {
            // Créer quelques commentaires
            const commentCountPerVideo = Math.floor(Math.random() * 3)
            for (let i = 0; i < commentCountPerVideo; i++) {
                const randomExposant = exposants[Math.floor(Math.random() * exposants.length)]
                await Comment.create({
                    salon: video.salon,
                    exposantId: randomExposant._id,
                    videoId: video._id,
                    content: `Commentaire de test ${i + 1} sur la vidéo ${video.name}`,
                    statut: 1
                })
                commentCount++
            }

            // Créer quelques likes
            const likeCountPerVideo = Math.floor(Math.random() * 5) + 1
            for (let i = 0; i < likeCountPerVideo; i++) {
                const randomExposant = exposants[Math.floor(Math.random() * exposants.length)]
                try {
                    await Like.create({
                        salon: video.salon,
                        exposantId: randomExposant._id,
                        videoId: video._id
                    })
                    likeCount++
                } catch (error) {
                    // Ignorer les erreurs de doublons (like unique)
                    if (error.code !== 11000) {
                        throw error
                    }
                }
            }
        }
        console.log(`✅ ${commentCount} commentaires créés`)
        console.log(`✅ ${likeCount} likes créés\n`)

        // Résumé
        console.log('═══════════════════════════════════════')
        console.log('📊 Résumé des données créées:')
        console.log('═══════════════════════════════════════')
        console.log(`   Salons: ${salons.length}`)
        console.log(`   Catégories: ${categories.length}`)
        console.log(`   Événements: ${events.length}`)
        console.log(`   Exposants: ${exposants.length}`)
        console.log(`   Vidéos: ${videoCount}`)
        console.log(`   Bondeals: ${bondealCount}`)
        console.log(`   Commentaires: ${commentCount}`)
        console.log(`   Likes: ${likeCount}`)
        console.log('═══════════════════════════════════════\n')

        console.log('✅ Seed terminé avec succès!')
        console.log('\n💡 Note: Tous les exposants ont le mot de passe "password123"')
        console.log('💡 Utilisez --clear pour nettoyer les données avant de seed\n')

    } catch (error) {
        console.error('❌ Erreur lors du seed:', error)
        throw error
    } finally {
        await mongoose.connection.close()
        console.log('🔌 Connexion fermée')
    }
}

// Exécuter le seed
if (require.main === module) {
    seed()
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

module.exports = seed

