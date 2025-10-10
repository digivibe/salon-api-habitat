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

const exportExposants = async () => {
    try {
        console.log("\n=== EXPORT DES EXPOSANTS ===\n");

        // Fetch all exposants with their categories
        const exposants = await Exposant.find().populate("categorie").lean();

        console.log(`✓ Found ${exposants.length} exposants in database`);

        // Create backup with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = path.join(__dirname, `../data/backup_exposants_${timestamp}.json`);

        // Save to file
        fs.writeFileSync(backupPath, JSON.stringify(exposants, null, 2));
        console.log(`✓ Backup saved to: ${backupPath}`);

        // Display summary
        console.log("\n=== SUMMARY ===");
        console.log(`Total exposants: ${exposants.length}`);

        // List all exposant names
        console.log("\n=== LISTE DES EXPOSANTS ===");
        exposants.forEach((expo, index) => {
            console.log(`${index + 1}. ${expo.nom} (${expo.email})`);
        });

        return exposants;
    } catch (error) {
        console.error("✗ Error exporting exposants:", error.message);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await exportExposants();
        console.log("\n✓ Export completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n✗ Export failed:", error.message);
        process.exit(1);
    }
};

main();
