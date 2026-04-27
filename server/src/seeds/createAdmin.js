// Seed script to create a default admin user.
// Run: node src/seeds/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@kindbridge.com';
        const exists = await User.findOne({ email: adminEmail });

        if (exists) {
            console.log('⚠️  Admin user already exists:', adminEmail);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        const admin = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            phone: '+91 00000 00000',
            passwordHash,
            role: 'admin',
            city: 'Platform HQ',
        });

        console.log('✅ Admin user created successfully!');
        console.log('   Email:    admin@kindbridge.com');
        console.log('   Password: admin123');
        console.log('   ID:', admin._id);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
