const mongoose = require('mongoose');

const adViewSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        adId: { type: mongoose.Schema.Types.ObjectId, ref: 'SponsorAd', required: true },
        durationSeconds: { type: Number, required: true },
        amountEarned: { type: Number, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AdView', adViewSchema);
