/**
 * Script d'envoi de notification de mise à jour
 *
 * Usage :
 *   node scripts/sendUpdateNotification.js --version 2.1.0
 *   node scripts/sendUpdateNotification.js --version 2.1.0 --salon <salonId>
 *   node scripts/sendUpdateNotification.js --version 2.1.0 --title "Titre custom" --body "Message custom"
 *   node scripts/sendUpdateNotification.js --dry-run --version 2.1.0
 *
 * Options :
 *   --version   (requis) Numéro de version de la mise à jour
 *   --title     Titre personnalisé de la notification
 *   --body      Corps personnalisé de la notification
 *   --salon     ID du salon (pour ne notifier que les devices de ce salon)
 *   --dry-run   Simuler l'envoi sans envoyer réellement
 */

require('dotenv').config()
const mongoose = require('mongoose')
const { notifyAllUsers } = require('../services/notificationService')
const User = require('../models/User')

// --- Parsing des arguments CLI ---
const args = process.argv.slice(2)
const getArg = (name) => {
    const idx = args.indexOf(`--${name}`)
    return idx !== -1 ? args[idx + 1] : null
}
const hasFlag = (name) => args.includes(`--${name}`)

const version = getArg('version')
const customTitle = getArg('title')
const customBody = getArg('body')
const salonId = getArg('salon') || null
const isDryRun = hasFlag('dry-run')

// --- Validation ---
if (!version) {
    console.error('❌ Erreur : --version est requis')
    console.error('   Exemple : node scripts/sendUpdateNotification.js --version 2.1.0')
    process.exit(1)
}

const title = customTitle || `Mise à jour disponible — v${version}`
const body = customBody || `Une nouvelle version de l'application est disponible. Mettez à jour pour profiter des dernières améliorations.`

// --- Connexion et envoi ---
const run = async () => {
    console.log('\n📱 Gestev — Script de notification de mise à jour')
    console.log('═══════════════════════════════════════════════')
    console.log(`  Version    : ${version}`)
    console.log(`  Titre      : ${title}`)
    console.log(`  Message    : ${body}`)
    console.log(`  Salon      : ${salonId || 'tous'}`)
    console.log(`  Mode       : ${isDryRun ? '🔍 dry-run (simulation)' : '🚀 envoi réel'}`)
    console.log('═══════════════════════════════════════════════\n')

    // Connexion MongoDB
    console.log('🔌 Connexion à MongoDB...')
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connecté\n')

    // Compter les devices cibles avant l'envoi
    const query = { isActive: true, 'preferences.enabled': true }
    if (salonId) query.salon = salonId

    const totalTargeted = await User.countDocuments(query)
    const withCategory = await User.countDocuments({
        ...query,
        $or: [
            { 'preferences.categories.appUpdates': true },
            { 'preferences.categories.appUpdates': { $exists: false } },
        ],
    })

    console.log(`📊 Devices ciblés   : ${totalTargeted}`)
    console.log(`📬 Avec appUpdates  : ${withCategory}`)

    if (withCategory === 0) {
        console.log('\n⚠️  Aucun device éligible. Envoi annulé.')
        await mongoose.disconnect()
        process.exit(0)
    }

    if (isDryRun) {
        console.log('\n✅ Dry-run terminé — aucune notification envoyée.')
        await mongoose.disconnect()
        process.exit(0)
    }

    // Envoi
    console.log('\n📤 Envoi des notifications...')
    const tickets = await notifyAllUsers(
        title,
        body,
        {
            action: 'app_update',
            version,
        },
        salonId,
        'appUpdates'
    )

    // Rapport
    const ok = tickets.filter(t => t.status === 'ok').length
    const errors = tickets.filter(t => t.status === 'error')

    console.log('\n📋 Rapport d\'envoi')
    console.log('─────────────────')
    console.log(`  Total envoyé : ${tickets.length}`)
    console.log(`  ✅ Succès    : ${ok}`)
    console.log(`  ❌ Erreurs   : ${errors.length}`)

    if (errors.length > 0) {
        console.log('\n  Détail des erreurs :')
        errors.forEach((t, i) => {
            console.log(`  [${i + 1}] ${t.details?.error || t.message || JSON.stringify(t)}`)
        })
    }

    console.log('\n✅ Script terminé.')
    await mongoose.disconnect()
}

run().catch((err) => {
    console.error('\n❌ Erreur fatale :', err.message || err)
    mongoose.disconnect()
    process.exit(1)
})
