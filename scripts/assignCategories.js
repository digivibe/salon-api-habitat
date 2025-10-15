require('dotenv').config()
const mongoose = require('mongoose')
const fs = require('fs').promises
const path = require('path')
const Exposant = require('../models/exposantModel')
const Categorie = require('../models/categorieModel')

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
}

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log(`${colors.green}✓ Database connected successfully${colors.reset}`)
    } catch (error) {
        console.error(`${colors.red}✗ Database connection error: ${error.message}${colors.reset}`)
        process.exit(1)
    }
}

// Parse assignment file
const parseAssignmentFile = async (filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n').map(line => line.trim()).filter(line => line)

        const assignments = []
        let currentCategory = null

        for (const line of lines) {
            // Skip separator lines
            if (line.startsWith('__')) continue

            // Check if it's a category (doesn't start with •)
            if (!line.startsWith('•')) {
                // Remove all emojis and special characters at the beginning
                // This regex removes emoji, directional marks, and other non-standard characters
                currentCategory = line
                    .replace(/[\u{1F000}-\u{1F9FF}]/gu, '') // Remove emojis
                    .replace(/^[^\w\sÀ-ÿ&']+/g, '') // Remove unwanted symbols at start (keep letters, numbers, spaces, accents, &, ')
                    .trim()

                if (currentCategory) {
                    assignments.push({
                        category: currentCategory,
                        exposants: []
                    })
                }
            } else {
                // It's an exposant
                if (currentCategory) {
                    // Remove • and any asterisk at the end
                    const exposantName = line.replace(/^•\s*/, '').replace(/\s*\*+\s*$/, '').trim()
                    if (exposantName) {
                        assignments[assignments.length - 1].exposants.push(exposantName)
                    }
                }
            }
        }

        return assignments
    } catch (error) {
        console.error(`${colors.red}✗ Error reading file: ${error.message}${colors.reset}`)
        throw error
    }
}

// Normalize string for better matching
const normalizeString = (str) => {
    return str.toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
}

// Find best matching exposant by name
const findExposantByName = async (name) => {
    // Try exact match first (case insensitive)
    let exposant = await Exposant.findOne({
        nom: { $regex: new RegExp(`^${name}$`, 'i') }
    })

    if (exposant) return { exposant, matchType: 'exact' }

    // Try partial match
    exposant = await Exposant.findOne({
        nom: { $regex: new RegExp(name, 'i') }
    })

    if (exposant) return { exposant, matchType: 'partial' }

    // Try normalized match
    const allExposants = await Exposant.find({})
    const normalizedSearchName = normalizeString(name)

    for (const exp of allExposants) {
        if (normalizeString(exp.nom) === normalizedSearchName) {
            return { exposant: exp, matchType: 'normalized' }
        }
    }

    return { exposant: null, matchType: 'not_found' }
}

// Find category by label
const findCategoryByLabel = async (label) => {
    // Escape special regex characters
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Try exact match first
    let category = await Categorie.findOne({
        label: { $regex: new RegExp(`^${escapedLabel}$`, 'i') }
    })

    if (category) return { category, matchType: 'exact' }

    // Try partial match
    category = await Categorie.findOne({
        label: { $regex: new RegExp(escapedLabel, 'i') }
    })

    if (category) return { category, matchType: 'partial' }

    return { category: null, matchType: 'not_found' }
}

// Main assignment function
const assignCategories = async () => {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}`)
    console.log(`${colors.cyan}   SCRIPT D'ASSIGNATION DES CATÉGORIES${colors.reset}`)
    console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`)

    // Connect to database
    await connectDB()

    // Parse assignment file
    const assignmentFilePath = path.join(__dirname, '../newassignation.txt')
    console.log(`${colors.blue}➤ Lecture du fichier d'assignations...${colors.reset}`)
    const assignments = await parseAssignmentFile(assignmentFilePath)
    console.log(`${colors.green}✓ ${assignments.length} catégories trouvées${colors.reset}\n`)

    // Statistics
    const stats = {
        categoriesProcessed: 0,
        categoriesNotFound: [],
        exposantsUpdated: 0,
        exposantsNotFound: [],
        exposantsPartialMatch: [],
        errors: []
    }

    // Process each category
    for (const assignment of assignments) {
        console.log(`\n${colors.yellow}━━━ Traitement : ${assignment.category} ━━━${colors.reset}`)

        // Find category
        const { category, matchType } = await findCategoryByLabel(assignment.category)

        if (!category) {
            console.log(`${colors.red}✗ Catégorie non trouvée: "${assignment.category}"${colors.reset}`)
            stats.categoriesNotFound.push(assignment.category)
            continue
        }

        if (matchType === 'partial') {
            console.log(`${colors.yellow}⚠ Match partiel pour catégorie: "${assignment.category}" → "${category.label}"${colors.reset}`)
        } else {
            console.log(`${colors.green}✓ Catégorie trouvée: "${category.label}"${colors.reset}`)
        }

        stats.categoriesProcessed++

        // Process exposants for this category
        for (const exposantName of assignment.exposants) {
            const { exposant, matchType: expMatchType } = await findExposantByName(exposantName)

            if (!exposant) {
                console.log(`  ${colors.red}✗ Exposant non trouvé: "${exposantName}"${colors.reset}`)
                stats.exposantsNotFound.push({ category: assignment.category, name: exposantName })
                continue
            }

            try {
                // Update exposant category
                const oldCategoryId = exposant.categorie
                exposant.categorie = category._id
                await exposant.save()

                if (expMatchType === 'partial' || expMatchType === 'normalized') {
                    console.log(`  ${colors.yellow}⚠ Match ${expMatchType}: "${exposantName}" → "${exposant.nom}"${colors.reset}`)
                    stats.exposantsPartialMatch.push({
                        searched: exposantName,
                        found: exposant.nom,
                        category: category.label
                    })
                } else {
                    console.log(`  ${colors.green}✓ "${exposant.nom}" assigné${colors.reset}`)
                }

                stats.exposantsUpdated++
            } catch (error) {
                console.log(`  ${colors.red}✗ Erreur lors de la mise à jour de "${exposantName}": ${error.message}${colors.reset}`)
                stats.errors.push({ exposant: exposantName, error: error.message })
            }
        }
    }

    // Display final statistics
    console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}`)
    console.log(`${colors.cyan}            RAPPORT FINAL${colors.reset}`)
    console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`)

    console.log(`${colors.green}✓ Catégories traitées: ${stats.categoriesProcessed}${colors.reset}`)
    console.log(`${colors.green}✓ Exposants mis à jour: ${stats.exposantsUpdated}${colors.reset}`)

    if (stats.categoriesNotFound.length > 0) {
        console.log(`\n${colors.red}✗ Catégories non trouvées (${stats.categoriesNotFound.length}):${colors.reset}`)
        stats.categoriesNotFound.forEach(cat => console.log(`  - ${cat}`))
    }

    if (stats.exposantsNotFound.length > 0) {
        console.log(`\n${colors.red}✗ Exposants non trouvés (${stats.exposantsNotFound.length}):${colors.reset}`)
        stats.exposantsNotFound.forEach(exp => console.log(`  - ${exp.name} (catégorie: ${exp.category})`))
    }

    if (stats.exposantsPartialMatch.length > 0) {
        console.log(`\n${colors.yellow}⚠ Exposants avec match approximatif (${stats.exposantsPartialMatch.length}):${colors.reset}`)
        stats.exposantsPartialMatch.forEach(exp =>
            console.log(`  - Recherché: "${exp.searched}" → Trouvé: "${exp.found}" (${exp.category})`)
        )
    }

    if (stats.errors.length > 0) {
        console.log(`\n${colors.red}✗ Erreurs rencontrées (${stats.errors.length}):${colors.reset}`)
        stats.errors.forEach(err => console.log(`  - ${err.exposant}: ${err.error}`))
    }

    console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`)

    // Close database connection
    await mongoose.connection.close()
    console.log(`${colors.green}✓ Connexion à la base de données fermée${colors.reset}`)

    // Exit with appropriate code
    const hasErrors = stats.categoriesNotFound.length > 0 ||
                     stats.exposantsNotFound.length > 0 ||
                     stats.errors.length > 0

    if (hasErrors) {
        console.log(`\n${colors.yellow}⚠ Le script s'est terminé avec des avertissements${colors.reset}\n`)
    } else {
        console.log(`\n${colors.green}✓ Le script s'est terminé avec succès!${colors.reset}\n`)
    }
}

// Run the script
assignCategories().catch(error => {
    console.error(`\n${colors.red}✗ Erreur fatale: ${error.message}${colors.reset}`)
    console.error(error.stack)
    process.exit(1)
})
