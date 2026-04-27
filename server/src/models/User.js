const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['donor', 'volunteer', 'ngo', 'admin'], required: true },
        city: { type: String, required: true },
        adBalance: { type: Number, default: 0 }, // money earned from watching ads
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
