require('dotenv').config()
const mongoose = require('mongoose')
const Categorie = require('../models/categorieModel')

const debugCategory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✓ Database connected\n')

        const searchTerm = "Architecture & Bureau d'études"
        console.log(`Recherche de: "${searchTerm}"`)
        console.log(`Longueur: ${searchTerm.length}`)
        console.log(`Caractères:`, searchTerm.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' '))
        console.log()

        // Try exact match (case insensitive)
        console.log('Test 1: Exact match (case insensitive)')
        let result = await Categorie.findOne({
            label: { $regex: new RegExp(`^${searchTerm}$`, 'i') }
        })
        console.log('Result:', result ? `Trouvé: "${result.label}"` : 'Non trouvé')
        console.log()

        // Try without regex escaping
        console.log('Test 2: Sans échappement de caractères spéciaux')
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        console.log(`Terme échappé: "${escapedTerm}"`)
        result = await Categorie.findOne({
            label: { $regex: new RegExp(`^${escapedTerm}$`, 'i') }
        })
        console.log('Result:', result ? `Trouvé: "${result.label}"` : 'Non trouvé')
        console.log()

        // Get the actual category from DB
        console.log('Test 3: Récupération directe de la catégorie')
        const actualCat = await Categorie.findOne({ label: /Architecture.*Bureau/i })
        if (actualCat) {
            console.log(`Catégorie trouvée: "${actualCat.label}"`)
            console.log(`Longueur: ${actualCat.label.length}`)
            console.log(`Caractères:`, actualCat.label.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' '))
            console.log()

            // Compare character by character
            console.log('Comparaison caractère par caractère:')
            const maxLen = Math.max(searchTerm.length, actualCat.label.length)
            for (let i = 0; i < maxLen; i++) {
                const char1 = searchTerm[i] || '∅'
                const char2 = actualCat.label[i] || '∅'
                const match = char1 === char2 ? '✓' : '✗'
                console.log(`  Pos ${i}: "${char1}" (${searchTerm.charCodeAt(i) || 'N/A'}) vs "${char2}" (${actualCat.label.charCodeAt(i) || 'N/A'}) ${match}`)
            }
        }

        await mongoose.connection.close()
    } catch (error) {
        console.error('Error:', error.message)
        console.error(error.stack)
        process.exit(1)
    }
}

debugCategory()
