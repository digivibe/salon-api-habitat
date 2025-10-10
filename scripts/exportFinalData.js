require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Import models
const Exposant = require("../models/exposantModel");
const Categorie = require("../models/categorieModel");

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✓ Database connected successfully");
    } catch (error) {
        console.error("✗ Database connection error:", error.message);
        process.exit(1);
    }
};

// Convert to CSV
const convertToCSV = (exposants) => {
    const headers = [
        "ID",
        "Nom",
        "Username",
        "Email",
        "Location",
        "Bio",
        "Téléphone",
        "Site Web",
        "LinkedIn",
        "Facebook",
        "Instagram",
        "Catégorie",
        "Profil URL",
        "Cover URL",
        "Statut de validation",
        "Statut"
    ];

    let csv = headers.join(",") + "\n";

    for (const expo of exposants) {
        const row = [
            expo._id.toString(),
            `"${expo.nom.replace(/"/g, '""')}"`,
            `"${expo.username.replace(/"/g, '""')}"`,
            expo.email,
            `"${(expo.location || "").replace(/"/g, '""')}"`,
            `"${(expo.bio || "").replace(/"/g, '""')}"`,
            expo.phoneNumber || "",
            expo.weblink || "",
            expo.linkedinLink || "",
            expo.facebookLink || "",
            expo.instaLink || "",
            expo.categorie ? `"${expo.categorie.label}"` : "",
            expo.profil || "",
            expo.cover || "",
            expo.isValid,
            expo.statut
        ];

        csv += row.join(",") + "\n";
    }

    return csv;
};

const exportFinalData = async () => {
    try {
        console.log("\n=== EXPORT DES DONNÉES FINALES ===\n");

        // Fetch all exposants with categories
        const exposants = await Exposant.find().populate("categorie").lean();

        console.log(`✓ Found ${exposants.length} exposants in database`);

        // Sort by name
        exposants.sort((a, b) => a.nom.localeCompare(b.nom));

        // Load migration operations to get generated passwords
        const operationsPath = path.join(__dirname, "../data/migration_operations.json");
        let operations = null;
        if (fs.existsSync(operationsPath)) {
            operations = JSON.parse(fs.readFileSync(operationsPath, "utf-8"));
        }

        // Create a map of exposant names to generated passwords
        const passwordMap = new Map();
        if (operations && operations.toAdd) {
            operations.toAdd.forEach((op) => {
                passwordMap.set(op.nom, op.generatedPassword);
            });
        }

        // 1. Export to JSON (full data)
        const jsonPath = path.join(__dirname, "../data/exposants_final.json");
        fs.writeFileSync(jsonPath, JSON.stringify(exposants, null, 2));
        console.log(`✓ Full data exported to: ${jsonPath}`);

        // 2. Export to CSV
        const csvData = convertToCSV(exposants);
        const csvPath = path.join(__dirname, "../data/exposants_final.csv");
        fs.writeFileSync(csvPath, csvData, "utf-8");
        console.log(`✓ CSV data exported to: ${csvPath}`);

        // 3. Export credentials for new exposants (with passwords)
        const credentials = [];
        for (const expo of exposants) {
            const generatedPassword = passwordMap.get(expo.nom);
            if (generatedPassword) {
                credentials.push({
                    nom: expo.nom,
                    username: expo.username,
                    email: expo.email,
                    password: generatedPassword,
                    note: "Nouveau compte créé lors de la migration"
                });
            }
        }

        if (credentials.length > 0) {
            const credentialsPath = path.join(__dirname, "../data/new_exposants_credentials.json");
            fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
            console.log(`✓ New credentials exported to: ${credentialsPath}`);
            console.log(`  (${credentials.length} nouveaux comptes)`);
        }

        // 4. Display summary
        console.log("\n=== SUMMARY ===");
        console.log(`Total exposants: ${exposants.length}`);

        // Group by category
        const byCategory = {};
        exposants.forEach((expo) => {
            const catLabel = expo.categorie ? expo.categorie.label : "Sans catégorie";
            byCategory[catLabel] = (byCategory[catLabel] || 0) + 1;
        });

        console.log("\n=== PAR CATÉGORIE ===");
        Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, count]) => {
                console.log(`  ${cat}: ${count}`);
            });

        // Group by validation status
        const byValidation = {
            0: exposants.filter((e) => e.isValid === 0).length,
            1: exposants.filter((e) => e.isValid === 1).length,
            2: exposants.filter((e) => e.isValid === 2).length,
            3: exposants.filter((e) => e.isValid === 3).length
        };

        console.log("\n=== PAR STATUT DE VALIDATION ===");
        console.log(`  Simple exposant (0): ${byValidation[0]}`);
        console.log(`  Validé sans publication (1): ${byValidation[1]}`);
        console.log(`  Validé avec publication (2): ${byValidation[2]}`);
        console.log(`  Administrateur (3): ${byValidation[3]}`);

        // List all exposants
        console.log("\n=== LISTE COMPLÈTE DES EXPOSANTS ===");
        exposants.forEach((expo, index) => {
            const catLabel = expo.categorie ? expo.categorie.label : "Sans catégorie";
            console.log(`${index + 1}. ${expo.nom} (${expo.email}) - ${catLabel}`);
        });

        return { exposants, credentials };
    } catch (error) {
        console.error("✗ Error exporting final data:", error.message);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await exportFinalData();

        console.log("\n✓ Export completed successfully!");
        console.log("\n📁 Files generated:");
        console.log("  - data/exposants_final.json (full data)");
        console.log("  - data/exposants_final.csv (spreadsheet format)");
        console.log("  - data/new_exposants_credentials.json (new accounts with passwords)");

        process.exit(0);
    } catch (error) {
        console.error("\n✗ Export failed:", error.message);
        process.exit(1);
    }
};

main();
