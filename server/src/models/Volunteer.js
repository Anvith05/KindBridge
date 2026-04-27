const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        idType: { type: String, required: true },
        idImageUrl: { type: String },
        verifyStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
        },
        rating: { type: Number, default: 0 },
        deliveryCount: { type: Number, default: 0 },
        badge: { type: String, default: 'Newbie' },
        notificationRadius: { type: Number, default: 5 }, // in km
        preferredNGOs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
