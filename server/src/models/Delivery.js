const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
    {
        donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
        volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
        ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }, // set once assigned to an NGO
        status: {
            type: String,
            enum: ['accepted', 'en_route_pickup', 'picked_up', 'en_route_delivery', 'delivered', 'cancelled'],
            default: 'accepted',
        },
        pickupOtp: { type: String }, // Verified by Donor at pickup
        pickupPhoto: { type: String }, // Photo uploaded at pickup
        dropoffOtp: { type: String }, // Verified by NGO at dropoff
        pickupConfirmedAt: { type: Date },
        deliveredAt: { type: Date },
        volunteerRating: { type: Number, min: 1, max: 5 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
