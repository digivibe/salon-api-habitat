require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Import models
const Exposant = require("../models/exposantModel");
const ExposantVideo = require("../models/exposantVideoModel");
const ExposantBondeal = require("../models/exposantBondealModel");
const Comment = require("../models/commentModel");
const Like = require("../models/likeModel");
const Login = require("../models/loginModel");

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

const executeMigration = async () => {
    try {
        console.log("\n=== EXECUTION DE LA MIGRATION ===\n");

        // Load operations
        const operationsPath = path.join(__dirname, "../data/migration_operations.json");
        if (!fs.existsSync(operationsPath)) {
            throw new Error("Migration operations file not found. Run 'node scripts/migrateExposants.js' first.");
        }

        const operations = JSON.parse(fs.readFileSync(operationsPath, "utf-8"));

        console.log("Operations to execute:");
        console.log(`- DELETE: ${operations.toDelete.length} exposants`);
        console.log(`- UPDATE: ${operations.toUpdate.length} exposants`);
        console.log(`- ADD: ${operations.toAdd.length} exposants`);

        // Confirm execution
        console.log("\n⚠️  WARNING: This will modify the database!");
        console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...\n");

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const results = {
            deleted: 0,
            updated: 0,
            added: 0,
            errors: []
        };

        // 1. DELETE exposants (and cascade delete related data)
        console.log("\n=== DELETING EXPOSANTS ===");
        for (const op of operations.toDelete) {
            try {
                const exposantId = op._id;

                // Delete related data
                await Promise.all([
                    Comment.deleteMany({ exposantId }),
                    ExposantBondeal.deleteMany({ exposantId }),
                    ExposantVideo.deleteMany({ exposantId }),
                    Like.deleteMany({ exposantId }),
                    Login.deleteMany({ exposantId })
                ]);

                // Delete exposant
                await Exposant.findByIdAndDelete(exposantId);

                console.log(`✓ Deleted: ${op.nom}`);
                results.deleted++;
            } catch (error) {
                console.error(`✗ Error deleting ${op.nom}:`, error.message);
                results.errors.push({ operation: "delete", nom: op.nom, error: error.message });
            }
        }

        // 2. UPDATE exposants
        console.log("\n=== UPDATING EXPOSANTS ===");
        for (const op of operations.toUpdate) {
            try {
                await Exposant.findByIdAndUpdate(op._id, op.newData, { runValidators: false });
                console.log(`✓ Updated: ${op.oldData.nom} → ${op.newData.nom}`);
                results.updated++;
            } catch (error) {
                console.error(`✗ Error updating ${op.oldData.nom}:`, error.message);
                results.errors.push({ operation: "update", nom: op.oldData.nom, error: error.message });
            }
        }

        // 3. ADD new exposants
        console.log("\n=== ADDING NEW EXPOSANTS ===");
        for (const op of operations.toAdd) {
            try {
                // Remove the generatedPassword field before saving
                const { generatedPassword, ...exposantData } = op;
                const newExposant = new Exposant(exposantData);
                await newExposant.save();
                console.log(`✓ Added: ${op.nom}`);
                results.added++;
            } catch (error) {
                console.error(`✗ Error adding ${op.nom}:`, error.message);
                results.errors.push({ operation: "add", nom: op.nom, error: error.message });
            }
        }

        // 4. Save results
        console.log("\n=== RESULTS ===");
        console.log(`✓ Deleted: ${results.deleted}/${operations.toDelete.length}`);
        console.log(`✓ Updated: ${results.updated}/${operations.toUpdate.length}`);
        console.log(`✓ Added: ${results.added}/${operations.toAdd.length}`);

        if (results.errors.length > 0) {
            console.log(`\n⚠️  Errors: ${results.errors.length}`);
            results.errors.forEach((err, i) => {
                console.log(`${i + 1}. [${err.operation}] ${err.nom}: ${err.error}`);
            });
        }

        // Save results to file
        const resultsPath = path.join(__dirname, "../data/migration_results.json");
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n✓ Results saved to: ${resultsPath}`);

        return results;
    } catch (error) {
        console.error("✗ Error during migration execution:", error.message);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await executeMigration();

        console.log("\n✓ Migration executed successfully!");
        console.log("\nNext: Run 'node scripts/exportFinalData.js' to export all exposants data");

        process.exit(0);
    } catch (error) {
        console.error("\n✗ Migration execution failed:", error.message);
        process.exit(1);
    }
};

main();
