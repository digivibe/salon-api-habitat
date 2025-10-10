require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Exposant = require('../models/exposantModel');
const Categorie = require('../models/categorieModel');

// Function to generate a secure random password
function generatePassword() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function resetAllPasswords() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database\n');

        // Get all exposants
        const exposants = await Exposant.find().populate('categorie').sort({ nom: 1 });
        console.log(`📊 Found ${exposants.length} exposants\n`);

        const passwordMap = [];
        let updateCount = 0;

        console.log('🔐 Resetting passwords...\n');

        for (const exposant of exposants) {
            let newPassword;

            // Special password for admin (3G CIVIL)
            if (exposant.username === '3g' || exposant.email === 'Walid.nouira@3gcivil.com') {
                newPassword = '7H91GCG9';
                console.log(`👑 Admin: ${exposant.nom.padEnd(30)} → ${newPassword}`);
            } else {
                // Generate random password for others
                newPassword = generatePassword();
                console.log(`✅ ${exposant.nom.padEnd(30)} → ${newPassword}`);
            }

            // Update password
            exposant.password = newPassword;
            await exposant.save();

            // Store for CSV export
            passwordMap.push({
                nom: exposant.nom,
                username: exposant.username,
                email: exposant.email,
                password: newPassword,
                location: exposant.location,
                bio: exposant.bio,
                phoneNumber: exposant.phoneNumber || '',
                weblink: exposant.weblink || '',
                linkedinLink: exposant.linkedinLink || '',
                facebookLink: exposant.facebookLink || '',
                instaLink: exposant.instaLink || '',
                profil: exposant.profil || '',
                cover: exposant.cover || '',
                categorie: exposant.categorie?.label || exposant.categorie || '',
                isValid: exposant.isValid,
                statut: exposant.statut,
                createdAt: exposant.createdAt,
                updatedAt: exposant.updatedAt
            });

            updateCount++;
        }

        console.log(`\n✅ ${updateCount} passwords updated successfully!\n`);

        // Export to CSV
        console.log('📝 Exporting to CSV...\n');

        const csvHeader = [
            'nom',
            'username',
            'email',
            'password',
            'location',
            'bio',
            'phoneNumber',
            'weblink',
            'linkedinLink',
            'facebookLink',
            'instaLink',
            'profil',
            'cover',
            'categorie',
            'isValid',
            'statut',
            'createdAt',
            'updatedAt'
        ].join(',');

        const csvRows = passwordMap.map(expo => {
            return [
                `"${expo.nom}"`,
                `"${expo.username}"`,
                `"${expo.email}"`,
                `"${expo.password}"`,
                `"${expo.location}"`,
                `"${expo.bio}"`,
                `"${expo.phoneNumber}"`,
                `"${expo.weblink}"`,
                `"${expo.linkedinLink}"`,
                `"${expo.facebookLink}"`,
                `"${expo.instaLink}"`,
                `"${expo.profil}"`,
                `"${expo.cover}"`,
                `"${expo.categorie}"`,
                expo.isValid,
                expo.statut,
                `"${expo.createdAt}"`,
                `"${expo.updatedAt}"`
            ].join(',');
        });

        const csvContent = [csvHeader, ...csvRows].join('\n');
        const csvPath = path.join(__dirname, '../data/exposants_final.csv');
        fs.writeFileSync(csvPath, csvContent, 'utf8');

        console.log(`✅ CSV exported to: ${csvPath}\n`);

        // Also export a simple password list for reference
        const passwordListContent = passwordMap
            .map(expo => `${expo.nom.padEnd(35)} | ${expo.email.padEnd(40)} | ${expo.password}`)
            .join('\n');

        const passwordListPath = path.join(__dirname, '../data/passwords_list.txt');
        fs.writeFileSync(passwordListPath, passwordListContent, 'utf8');

        console.log(`✅ Password list exported to: ${passwordListPath}\n`);

        console.log('═══════════════════════════════════════');
        console.log('📋 Summary:');
        console.log('═══════════════════════════════════════');
        console.log(`Total exposants: ${exposants.length}`);
        console.log(`Passwords reset: ${updateCount}`);
        console.log(`Admin password: 7H91GCG9`);
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
}

resetAllPasswords();
