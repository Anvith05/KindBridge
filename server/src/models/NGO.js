const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        orgName: { type: String, required: true },
        regCertUrl: { type: String },
        verifyStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        address: { type: String, required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' },
        },
        mission: { type: String },
        acceptedCategories: [{ type: String }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('NGO', ngoSchema);
