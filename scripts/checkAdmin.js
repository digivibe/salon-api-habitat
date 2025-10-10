require('dotenv').config();
const mongoose = require('mongoose');
const Exposant = require('../models/exposantModel');
const Categorie = require('../models/categorieModel');

async function checkAdmin() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database\n');

        // Find admin user (isValid = 3)
        const admins = await Exposant.find({ isValid: 3 }).populate('categorie');

        console.log(`📊 Total administrators found: ${admins.length}\n`);

        if (admins.length === 0) {
            console.log('❌ No administrators found!');
            console.log('\nSearching for user "3g" or email "Walid.nouira@3gcivil.com"...\n');

            const user3g = await Exposant.findOne({
                $or: [
                    { username: '3g' },
                    { email: 'Walid.nouira@3gcivil.com' },
                    { nom: /3g/i }
                ]
            }).populate('categorie');

            if (user3g) {
                console.log('✅ User found:');
                console.log({
                    _id: user3g._id,
                    nom: user3g.nom,
                    username: user3g.username,
                    email: user3g.email,
                    isValid: user3g.isValid,
                    statut: user3g.statut,
                    categorie: user3g.categorie?.label || user3g.categorie
                });
            } else {
                console.log('❌ User not found');
            }
        } else {
            admins.forEach((admin, index) => {
                console.log(`👑 Admin ${index + 1}:`);
                console.log('─────────────────────────────────');
                console.log(`ID:       ${admin._id}`);
                console.log(`Nom:      ${admin.nom}`);
                console.log(`Username: ${admin.username}`);
                console.log(`Email:    ${admin.email}`);
                console.log(`isValid:  ${admin.isValid}`);
                console.log(`Statut:   ${admin.statut}`);
                console.log(`Catégorie: ${admin.categorie?.label || admin.categorie}`);
                console.log('');
            });
        }

        // Also show all exposants with their usernames and emails for reference
        console.log('\n📋 All exposants (username / email / isValid):');
        console.log('═══════════════════════════════════════════════\n');
        const allExposants = await Exposant.find().select('nom username email isValid statut').sort({ nom: 1 });
        allExposants.forEach(expo => {
            const validLabel = ['Simple', 'Validé sans pub', 'Validé avec pub', 'Admin'][expo.isValid] || expo.isValid;
            const statutLabel = expo.statut === 1 ? '✅' : '❌';
            console.log(`${statutLabel} ${expo.nom.padEnd(30)} | ${(expo.username || '').padEnd(20)} | ${expo.email.padEnd(35)} | ${validLabel}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

checkAdmin();
