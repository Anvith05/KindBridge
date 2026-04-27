const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
    {
        donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String },
        condition: { type: String, enum: ['new', 'gently_used', 'heavily_used'], required: true },
        photoUrls: [{ type: String }],
        pickupAddress: { type: String, required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' },
        },
        availabilityFrom: { type: Date, required: true },
        availabilityTo: { type: Date, required: true },
        status: {
            type: String,
            enum: ['available', 'assigned', 'picked_up', 'delivered', 'cancelled'],
            default: 'available',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
