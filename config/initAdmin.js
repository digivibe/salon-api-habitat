const Exposant = require('../models/Exposant')
const Salon = require('../models/Salon')
const Categorie = require('../models/Categorie')

/**
 * Initialiser l'administrateur par défaut
 * Crée ou met à jour l'admin avec les identifiants du .env
 */
const initAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminEmail || !adminPassword) {
            console.log('⚠️  ADMIN_EMAIL ou ADMIN_PASSWORD non définis dans .env')
            return
        }

        // Vérifier si un salon existe, sinon en créer un par défaut
        let defaultSalon = await Salon.findOne({ statut: 1 })
        if (!defaultSalon) {
            console.log('📋 Création du salon par défaut...')
            defaultSalon = await Salon.create({
                nom: 'Salon Principal',
                slug: 'salon-principal',
                description: 'Salon principal par défaut',
                statut: 1
            })
            console.log(`✅ Salon créé: ${defaultSalon.nom} (${defaultSalon._id})`)
        }

        // Vérifier si une catégorie existe, sinon en créer une par défaut
        let defaultCategorie = await Categorie.findOne({ salon: defaultSalon._id, statut: 1 })
        if (!defaultCategorie) {
            console.log('📋 Création de la catégorie par défaut...')
            defaultCategorie = await Categorie.create({
                salon: defaultSalon._id,
                label: 'Administration',
                color: '#2563eb',
                borderColor: '#1e40af',
                statut: 1
            })
            console.log(`✅ Catégorie créée: ${defaultCategorie.label} (${defaultCategorie._id})`)
        }

        // Chercher l'admin par email
        let admin = await Exposant.findOne({ email: adminEmail.trim().toLowerCase() })

        if (admin) {
            // Mettre à jour l'admin existant
            console.log(`📋 Mise à jour de l'administrateur existant: ${admin.nom}`)
            
            // Mettre à jour le mot de passe si nécessaire
            admin.password = adminPassword
            admin.isValid = 3 // Administrateur
            admin.statut = 1 // Actif
            admin.salon = defaultSalon._id
            admin.categorie = defaultCategorie._id
            
            await admin.save()
            console.log(`✅ Administrateur mis à jour: ${admin.nom} (${admin.email})`)
        } else {
            // Créer un nouvel admin
            console.log('📋 Création de l\'administrateur par défaut...')
            
            admin = await Exposant.create({
                salon: defaultSalon._id,
                categorie: defaultCategorie._id,
                email: adminEmail.trim().toLowerCase(),
                username: adminEmail.trim().toLowerCase(),
                password: adminPassword,
                nom: 'Administrateur',
                location: 'Paris, France',
                bio: 'Administrateur du système Dormans',
                isValid: 3, // Administrateur
                statut: 1 // Actif
            })

            console.log(`✅ Administrateur créé: ${admin.nom} (${admin.email})`)
        }

        console.log('\n═══════════════════════════════════════')
        console.log('🔐 Identifiants administrateur:')
        console.log('═══════════════════════════════════════')
        console.log(`Email:    ${admin.email}`)
        console.log(`Password: ${adminPassword}`)
        console.log('═══════════════════════════════════════\n')

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'admin:', error.message)
    }
}

module.exports = initAdmin

