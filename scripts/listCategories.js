require('dotenv').config()
const mongoose = require('mongoose')
const Categorie = require('../models/categorieModel')

const listCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✓ Database connected\n')

        const categories = await Categorie.find({})

        console.log(`Total categories: ${categories.length}\n`)
        console.log('Liste des catégories:')
        console.log('═══════════════════════════════════════════\n')

        categories.forEach((cat, index) => {
            console.log(`${index + 1}. "${cat.label}"`)
            console.log(`   ID: ${cat._id}`)
            console.log(`   Status: ${cat.statut}`)
            console.log()
        })

        await mongoose.connection.close()
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

listCategories()
