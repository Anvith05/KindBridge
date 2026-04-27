const mongoose = require('mongoose');

const sponsorAdSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        mediaUrl: { type: String }, // video or image URL
        targetUrl: { type: String }, // where to send user on click
        payoutPerSecond: { type: Number, required: true, default: 0.01 }, // money per second watched
        maxBudget: { type: Number, required: true }, // total budget for this ad
        totalSpent: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SponsorAd', sponsorAdSchema);
