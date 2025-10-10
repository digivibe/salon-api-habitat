/**
 * Script principal de migration des exposants
 *
 * Ce script orchestre le processus complet de migration:
 * 1. Sauvegarde de la base de données actuelle
 * 2. Analyse des opérations de migration
 * 3. Exécution de la migration (avec confirmation)
 * 4. Export des données finales
 */

const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const runScript = (scriptPath, description) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  ${description}`);
    console.log("=".repeat(60));

    try {
        execSync(`node ${scriptPath}`, { stdio: "inherit" });
        return true;
    } catch (error) {
        console.error(`\n✗ Error running ${scriptPath}`);
        return false;
    }
};

const main = async () => {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                                                            ║");
    console.log("║        MIGRATION DES EXPOSANTS - SALON HABITAT 2025        ║");
    console.log("║                                                            ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    console.log("\nCe script va effectuer les opérations suivantes:");
    console.log("  1. Sauvegarder la base de données actuelle");
    console.log("  2. Analyser les opérations de migration");
    console.log("  3. Exécuter la migration (ATTENTION: modifie la DB!)");
    console.log("  4. Exporter les données finales en JSON et CSV");

    const answer = await question("\nVoulez-vous continuer? (oui/non): ");

    if (answer.toLowerCase() !== "oui") {
        console.log("\n❌ Migration annulée.");
        rl.close();
        process.exit(0);
    }

    // Step 1: Backup
    if (!runScript("scripts/exportExposants.js", "ÉTAPE 1/4 : Sauvegarde de la base de données")) {
        rl.close();
        process.exit(1);
    }

    // Step 2: Analyze
    if (!runScript("scripts/migrateExposants.js", "ÉTAPE 2/4 : Analyse des opérations de migration")) {
        rl.close();
        process.exit(1);
    }

    // Step 3: Execute (with confirmation)
    console.log("\n⚠️  ATTENTION: La prochaine étape va MODIFIER la base de données!");
    const confirmExecute = await question("\nVoulez-vous VRAIMENT exécuter la migration? (oui/non): ");

    if (confirmExecute.toLowerCase() !== "oui") {
        console.log("\n❌ Migration annulée. Les analyses sont sauvegardées dans data/migration_operations.json");
        rl.close();
        process.exit(0);
    }

    if (!runScript("scripts/executeMigration.js", "ÉTAPE 3/4 : Exécution de la migration")) {
        rl.close();
        process.exit(1);
    }

    // Step 4: Export final data
    if (!runScript("scripts/exportFinalData.js", "ÉTAPE 4/4 : Export des données finales")) {
        rl.close();
        process.exit(1);
    }

    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                                                            ║");
    console.log("║              ✓ MIGRATION TERMINÉE AVEC SUCCÈS!             ║");
    console.log("║                                                            ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    console.log("\n📁 Fichiers générés dans le dossier 'data/':");
    console.log("  - backup_exposants_*.json (sauvegarde complète)");
    console.log("  - migration_operations.json (opérations effectuées)");
    console.log("  - migration_results.json (résultats de la migration)");
    console.log("  - exposants_final.json (données finales en JSON)");
    console.log("  - exposants_final.csv (données finales en CSV)");
    console.log("  - new_exposants_credentials.json (mots de passe des nouveaux comptes)");

    rl.close();
    process.exit(0);
};

main().catch((error) => {
    console.error("\n✗ Une erreur est survenue:", error.message);
    rl.close();
    process.exit(1);
});
