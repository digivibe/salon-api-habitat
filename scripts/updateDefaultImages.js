require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Import models
const Exposant = require("../models/exposantModel");

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

const updateDefaultImages = async () => {
    try {
        console.log("\n=== MISE À JOUR DES IMAGES PAR DÉFAUT ===\n");

        // Load the list of newly added exposants
        const operationsPath = path.join(__dirname, "../data/migration_operations.json");
        if (!fs.existsSync(operationsPath)) {
            throw new Error("Migration operations file not found.");
        }

        const operations = JSON.parse(fs.readFileSync(operationsPath, "utf-8"));
        const newExposantNames = operations.toAdd.map(op => op.nom);

        console.log(`Found ${newExposantNames.length} newly added exposants to update\n`);

        // Correct default images
        const correctProfileUrl = "https://salon-api-habitat.onrender.com/uploads/exposants_profile_pic/logo.png";
        const correctCoverUrl = "https://salonapp-api-y25d.onrender.com/uploads/exposants_cover_pic/default.png";

        let updated = 0;

        for (const nom of newExposantNames) {
            try {
                const exposant = await Exposant.findOne({ nom });

                if (!exposant) {
                    console.log(`⚠️  ${nom} not found in database`);
                    continue;
                }

                // Update images
                await Exposant.findByIdAndUpdate(exposant._id, {
                    profil: correctProfileUrl,
                    cover: correctCoverUrl
                }, { runValidators: false });

                console.log(`✓ Updated images for: ${nom}`);
                updated++;
            } catch (error) {
                console.error(`✗ Error updating ${nom}:`, error.message);
            }
        }

        console.log("\n=== RESULTS ===");
        console.log(`✓ Updated: ${updated}/${newExposantNames.length} exposants`);

        return { updated, total: newExposantNames.length };
    } catch (error) {
        console.error("✗ Error updating default images:", error.message);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await updateDefaultImages();

        console.log("\n✓ Image update completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n✗ Image update failed:", error.message);
        process.exit(1);
    }
};

main();
