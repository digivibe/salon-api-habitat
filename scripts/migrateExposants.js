require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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

// Normalize string for comparison (remove accents, lowercase, trim, remove special chars)
const normalizeString = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s]/g, "") // Remove special characters
        .replace(/\s+/g, " "); // Normalize spaces
};

// Calculate similarity score between two strings (Levenshtein-like)
const calculateSimilarity = (str1, str2) => {
    const norm1 = normalizeString(str1);
    const norm2 = normalizeString(str2);

    if (norm1 === norm2) return 1;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;

    // Simple word-based comparison
    const words1 = norm1.split(" ");
    const words2 = norm2.split(" ");

    let matches = 0;
    for (const word1 of words1) {
        for (const word2 of words2) {
            if (word1 === word2 && word1.length > 2) {
                matches++;
            }
        }
    }

    return matches / Math.max(words1.length, words2.length);
};

// Find best match in database
const findBestMatch = (newName, existingExposants) => {
    let bestMatch = null;
    let bestScore = 0;

    for (const expo of existingExposants) {
        const score = calculateSimilarity(newName, expo.nom);
        if (score > bestScore && score > 0.6) { // Threshold of 60% similarity
            bestScore = score;
            bestMatch = expo;
        }
    }

    return { match: bestMatch, score: bestScore };
};

// Generate random password
const generatePassword = () => {
    return crypto.randomBytes(8).toString("hex");
};

// Parse CSV file - improved version
const parseCSV = (filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    const exposants = [];

    // Skip header rows (first 3 lines)
    for (let i = 3; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Handle multi-line entries
        while (line.split(",").length < 9 && i + 1 < lines.length) {
            i++;
            line += " " + lines[i].trim();
        }

        // Split by comma, but handle commas within quotes
        const parts = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                parts.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        parts.push(current.trim());

        // Skip if no name
        if (!parts[0] || parts[0] === "") continue;

        const nom = parts[0].replace(/"/g, "").trim();
        const location = parts[1] ? parts[1].replace(/"/g, "").trim() : "";
        const bio = parts[2] ? parts[2].replace(/"/g, "").trim() : "";
        const phoneNumber = parts[3] ? parts[3].replace(/"/g, "").trim() : "";
        const email = parts[4] ? parts[4].replace(/"/g, "").trim() : "";
        const weblink = parts[5] ? parts[5].replace(/"/g, "").trim() : "";
        const linkedinLink = parts[6] ? parts[6].replace(/"/g, "").trim() : "";
        const facebookLink = parts[7] ? parts[7].replace(/"/g, "").trim() : "";
        const instaLink = parts[8] ? parts[8].replace(/"/g, "").trim() : "";

        exposants.push({
            nom,
            location,
            bio,
            phoneNumber,
            email,
            weblink,
            linkedinLink,
            facebookLink,
            instaLink
        });
    }

    return exposants;
};

// Parse delete list
const parseDeleteList = (filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    return content
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);
};

// Main migration function
const migrateExposants = async () => {
    try {
        console.log("\n=== MIGRATION DES EXPOSANTS ===\n");

        // 1. Load current exposants from database
        const existingExposants = await Exposant.find().populate("categorie").lean();
        console.log(`✓ Loaded ${existingExposants.length} existing exposants from database`);

        // 2. Load new exposants from CSV
        const csvPath = path.join(__dirname, "../data/expos2025.csv");
        const newExposants = parseCSV(csvPath);
        console.log(`✓ Loaded ${newExposants.length} new exposants from CSV`);

        // 3. Load delete list
        const deleteListPath = path.join(__dirname, "../data/todelete.txt");
        const toDeleteNames = parseDeleteList(deleteListPath);
        console.log(`✓ Loaded ${toDeleteNames.length} exposants to delete`);

        // 4. Get default category (or first available)
        const defaultCategory = await Categorie.findOne({ statut: 1 });
        if (!defaultCategory) {
            throw new Error("No active category found in database");
        }
        console.log(`✓ Using default category: ${defaultCategory.label}`);

        // 5. Process operations
        const operations = {
            toDelete: [],
            toUpdate: [],
            toAdd: [],
            toKeep: []
        };

        // Mark exposants for deletion (except Dormans Coworking)
        for (const deleteName of toDeleteNames) {
            const { match, score } = findBestMatch(deleteName, existingExposants);
            if (match && match.nom !== "Dormans Coworking") {
                operations.toDelete.push({
                    _id: match._id,
                    nom: match.nom,
                    matchedWith: deleteName,
                    similarity: score
                });
            }
        }

        // Match new exposants with existing ones
        const unmatchedExisting = existingExposants.filter(
            expo =>
                expo.nom === "Dormans Coworking" || // Always keep
                !operations.toDelete.find(d => d._id.toString() === expo._id.toString())
        );

        for (const newExpo of newExposants) {
            // Skip if Dormans Coworking (already in DB)
            if (normalizeString(newExpo.nom).includes("dormans coworking")) {
                operations.toKeep.push({
                    nom: newExpo.nom,
                    reason: "Dormans Coworking - has publications, must not be touched"
                });
                continue;
            }

            // Skip empty entries
            if (!newExpo.nom || newExpo.nom.trim() === "") {
                continue;
            }

            // Try to find a match
            const { match, score } = findBestMatch(newExpo.nom, unmatchedExisting);

            if (match && score > 0.7) {
                // UPDATE existing exposant
                operations.toUpdate.push({
                    _id: match._id,
                    oldData: {
                        nom: match.nom,
                        email: match.email,
                        location: match.location
                    },
                    newData: {
                        nom: newExpo.nom,
                        email: newExpo.email || match.email,
                        location: newExpo.location || match.location || "Dormans",
                        bio: newExpo.bio || match.bio || "Exposant du salon Habitat",
                        phoneNumber: newExpo.phoneNumber || match.phoneNumber || "",
                        weblink: newExpo.weblink || match.weblink || "",
                        linkedinLink: newExpo.linkedinLink || match.linkedinLink || "",
                        facebookLink: newExpo.facebookLink || match.facebookLink || "",
                        instaLink: newExpo.instaLink || match.instaLink || ""
                    },
                    similarity: score
                });
            } else {
                // ADD new exposant
                const password = generatePassword();
                const username = normalizeString(newExpo.nom).replace(/\s+/g, "") + "_" + Math.floor(Math.random() * 1000);

                operations.toAdd.push({
                    categorie: defaultCategory._id,
                    email: newExpo.email || `${username}@salon-habitat.fr`,
                    username: username,
                    password: password,
                    nom: newExpo.nom,
                    location: newExpo.location || "Dormans",
                    bio: newExpo.bio || "Exposant du salon Habitat",
                    phoneNumber: newExpo.phoneNumber || "",
                    weblink: newExpo.weblink || "",
                    linkedinLink: newExpo.linkedinLink || "",
                    facebookLink: newExpo.facebookLink || "",
                    instaLink: newExpo.instaLink || "",
                    profil: "https://res.cloudinary.com/dfqiz1ndw/image/upload/v1721377650/d0ordcddjqs2edbyfcid.png",
                    cover: "https://res.cloudinary.com/dfqiz1ndw/image/upload/v1721377561/fnhugw7xma2zgsmmnjbh.png",
                    isValid: 2,
                    statut: 1,
                    generatedPassword: password // For export only
                });
            }
        }

        // 6. Display summary
        console.log("\n=== SUMMARY ===");
        console.log(`✓ To DELETE: ${operations.toDelete.length} exposants`);
        console.log(`✓ To UPDATE: ${operations.toUpdate.length} exposants`);
        console.log(`✓ To ADD: ${operations.toAdd.length} exposants`);
        console.log(`✓ To KEEP unchanged: ${operations.toKeep.length} exposants`);

        // 7. Save operations to file
        const operationsPath = path.join(__dirname, "../data/migration_operations.json");
        fs.writeFileSync(operationsPath, JSON.stringify(operations, null, 2));
        console.log(`\n✓ Operations saved to: ${operationsPath}`);

        // 8. Display details
        if (operations.toDelete.length > 0) {
            console.log("\n=== TO DELETE ===");
            operations.toDelete.forEach((op, i) => {
                console.log(`${i + 1}. ${op.nom} (matched with "${op.matchedWith}" - ${Math.round(op.similarity * 100)}% similarity)`);
            });
        }

        if (operations.toUpdate.length > 0) {
            console.log("\n=== TO UPDATE ===");
            operations.toUpdate.forEach((op, i) => {
                console.log(`${i + 1}. "${op.oldData.nom}" → "${op.newData.nom}" (${Math.round(op.similarity * 100)}% similarity)`);
            });
        }

        if (operations.toAdd.length > 0) {
            console.log("\n=== TO ADD ===");
            operations.toAdd.forEach((op, i) => {
                console.log(`${i + 1}. ${op.nom} (${op.email})`);
            });
        }

        return operations;
    } catch (error) {
        console.error("✗ Error during migration:", error.message);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        const operations = await migrateExposants();

        console.log("\n=== NEXT STEPS ===");
        console.log("1. Review the operations in data/migration_operations.json");
        console.log("2. Run 'node scripts/executeMigration.js' to apply changes");
        console.log("\n✓ Migration analysis completed successfully!");

        process.exit(0);
    } catch (error) {
        console.error("\n✗ Migration failed:", error.message);
        process.exit(1);
    }
};

main();
