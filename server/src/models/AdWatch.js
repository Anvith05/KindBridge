const mongoose = require('mongoose');

const adWatchSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        adSlotId: { type: String, required: true },
        earnedAmount: { type: Number, default: 2 }, // E.g., Rs. 2 per watch
    },
    { timestamps: true }
);

module.exports = mongoose.model('AdWatch', adWatchSchema);
