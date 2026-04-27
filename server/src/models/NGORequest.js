const mongoose = require('mongoose');

const ngoRequestSchema = new mongoose.Schema(
    {
        ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
        itemName: { type: String, required: true },
        category: { type: String, required: true },
        quantityNeeded: { type: Number, required: true },
        quantityFulfilled: { type: Number, default: 0 },
        urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        deadline: { type: Date },
        status: { type: String, enum: ['active', 'fulfilled', 'cancelled'], default: 'active' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('NGORequest', ngoRequestSchema);
