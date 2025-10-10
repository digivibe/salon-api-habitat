require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Exposant = require('../models/exposantModel');

async function resetAdminPassword() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database\n');

        // Find admin user
        const admin = await Exposant.findOne({
            $or: [
                { username: '3g' },
                { email: 'Walid.nouira@3gcivil.com' }
            ]
        });

        if (!admin) {
            console.log('❌ Admin user not found!');
            return;
        }

        console.log(`📋 Admin found: ${admin.nom} (${admin.email})\n`);

        // Set new password
        const newPassword = '7H91GCG9';

        console.log('🔐 Setting new password...');
        admin.password = newPassword;

        // Save (the pre-save hook will hash the password)
        await admin.save();

        console.log('✅ Password reset successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('📋 New credentials:');
        console.log('═══════════════════════════════════════');
        console.log(`Username: ${admin.username}`);
        console.log(`Email:    ${admin.email}`);
        console.log(`Password: ${newPassword}`);
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
}

resetAdminPassword();
