const Delivery = require('../models/Delivery');
const Donation = require('../models/Donation');
const Volunteer = require('../models/Volunteer');
const { emitToUser, emitToRole } = require('../utils/socketEmitter');

// @desc    Accept a donation delivery (Volunteer)
// @route   POST /api/deliveries/:donationId/accept
const acceptDelivery = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.donationId).populate('donorId', 'name');
        if (!donation || donation.status !== 'available') {
            return res.status(400).json({ error: 'Donation not available' });
        }

        const volunteer = await Volunteer.findOne({ userId: req.user.id }).populate('userId', 'name');
        if (!volunteer || volunteer.verifyStatus !== 'approved') {
            return res.status(403).json({ error: 'Only approved volunteers can accept deliveries' });
        }

        // Change donation status
        donation.status = 'assigned';
        await donation.save();

        // Create delivery record with pickup OTP
        const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const delivery = await Delivery.create({
            donationId: donation._id,
            volunteerId: volunteer._id,
            status: 'accepted',
            pickupOtp,
        });

        // 🔔 Notify donor their item has been accepted — include pickup OTP
        await emitToUser(req, donation.donorId._id || donation.donorId, 'donation:accepted', {
            message: `Your donation "${donation.title}" has been accepted by ${volunteer.userId?.name || 'a volunteer'}! Share this OTP at pickup: ${pickupOtp}`,
            donationId: donation._id,
            deliveryId: delivery._id,
            pickupOtp,
        });

        // 🔔 Notify admins
        emitToRole(req, 'admin', 'delivery:new', {
            message: `New delivery created for "${donation.title}"`,
            deliveryId: delivery._id,
        });

        res.status(201).json(delivery);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error accepting delivery' });
    }
};

// @desc    Confirm pickup
// @route   PATCH /api/deliveries/:id/pickup
const confirmPickup = async (req, res) => {
    try {
        const { otp } = req.body;
        const delivery = await Delivery.findById(req.params.id).populate('volunteerId');

        if (!delivery || delivery.volunteerId.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized for this delivery' });
        }

        if (delivery.pickupOtp !== otp) {
            return res.status(400).json({ error: 'Invalid pickup OTP' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Pickup photo is required' });
        }

        // Generate a dropoff OTP for the NGO to verify at delivery
        const dropoffOtp = Math.floor(1000 + Math.random() * 9000).toString();
        delivery.status = 'picked_up';
        delivery.pickupConfirmedAt = new Date();
        delivery.dropoffOtp = dropoffOtp;
        delivery.pickupPhoto = req.file.filename;
        await delivery.save();

        const donation = await Donation.findById(delivery.donationId);
        donation.status = 'picked_up';
        await donation.save();

        // 🔔 Notify donor of pickup
        await emitToUser(req, donation.donorId, 'donation:pickedUp', {
            message: `Your donation "${donation.title}" has been picked up! It's on its way to the NGO.`,
            donationId: donation._id,
        });

        // 🔔 Notify NGO with the dropoff OTP if assigned
        if (delivery.ngoId) {
            const NGO = require('../models/NGO');
            const ngo = await NGO.findById(delivery.ngoId);
            if (ngo) {
                await emitToUser(req, ngo.userId, 'delivery:incoming', {
                    message: `A donation is heading to you! Use this OTP to confirm receipt: ${dropoffOtp}`,
                    deliveryId: delivery._id,
                    dropoffOtp,
                });
            }
        }

        res.json(delivery);
    } catch (error) {
        res.status(500).json({ error: 'Server error confirming pickup' });
    }
};

// @desc    Confirm delivery to NGO (with dropoff OTP verification)
// @route   PATCH /api/deliveries/:id/deliver
const confirmDelivery = async (req, res) => {
    try {
        const { otp } = req.body;
        const delivery = await Delivery.findById(req.params.id).populate('volunteerId');
        if (!delivery || delivery.volunteerId.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized for this delivery' });
        }

        if (delivery.dropoffOtp && delivery.dropoffOtp !== otp) {
            return res.status(400).json({ error: 'Invalid dropoff OTP' });
        }

        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();
        await delivery.save();

        const donation = await Donation.findById(delivery.donationId);
        donation.status = 'delivered';
        await donation.save();

        // Update volunteer stats
        const vol = await Volunteer.findById(delivery.volunteerId._id);
        vol.deliveryCount += 1;
        await vol.save();

        // 🔔 Notify donor of delivery  
        await emitToUser(req, donation.donorId, 'donation:delivered', {
            message: `Your donation "${donation.title}" has been successfully delivered to an NGO! 🎉`,
            donationId: donation._id,
        });

        res.json(delivery);
    } catch (error) {
        res.status(500).json({ error: 'Server error confirming delivery' });
    }
};

// @desc    Rate volunteer (Donor or NGO)
// @route   POST /api/deliveries/:id/rate
const rateVolunteer = async (req, res) => {
    try {
        const { rating } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating' });

        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

        delivery.volunteerRating = rating;
        await delivery.save();

        // Re-calculate average volunteer rating
        const vol = await Volunteer.findById(delivery.volunteerId);
        const allRatings = await Delivery.find({ volunteerId: vol._id, volunteerRating: { $exists: true } });

        const sum = allRatings.reduce((acc, curr) => acc + curr.volunteerRating, 0);
        vol.rating = sum / allRatings.length;
        await vol.save();

        // 🔔 Notify volunteer of new rating
        await emitToUser(req, vol.userId, 'volunteer:rated', {
            message: `You received a ${rating}-star rating! Your average is now ${vol.rating.toFixed(1)} ⭐`,
        });

        res.json({ message: 'Rating submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error saving rating' });
    }
};

// @desc    Get logged in user's deliveries
// @route   GET /api/deliveries/my
const getMyDeliveries = async (req, res) => {
    try {
        const volunteer = await Volunteer.findOne({ userId: req.user.id });
        if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });

        const deliveries = await Delivery.find({ volunteerId: volunteer._id })
            .populate({ path: 'donationId', populate: { path: 'donorId', select: 'name phone' } })
            .populate({ path: 'ngoId', select: 'orgName address' })
            .sort('-createdAt');

        res.json(deliveries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching deliveries' });
    }
};

// @desc    Get secure pickup photo
// @route   GET /api/deliveries/:id/photo
const getPickupPhoto = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('donationId')
            .populate('volunteerId')
            .populate('ngoId');

        if (!delivery || !delivery.pickupPhoto) {
            return res.status(404).json({ error: 'Photo not found for this delivery' });
        }

        const isVolunteer = delivery.volunteerId.userId.toString() === req.user.id;
        const isDonor = delivery.donationId.donorId.toString() === req.user.id;
        const isNgo = delivery.ngoId && delivery.ngoId.userId.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isVolunteer && !isDonor && !isNgo && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to view this photo' });
        }

        const path = require('path');
        const fs = require('fs');
        const photoPath = path.join(__dirname, '../../uploads/deliveries', delivery.pickupPhoto);

        if (!fs.existsSync(photoPath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.sendFile(photoPath);
    } catch (error) {
        console.error('Error fetching photo:', error);
        res.status(500).json({ error: 'Server error fetching photo' });
    }
};

// @desc    Get delivery by donation ID
// @route   GET /api/deliveries/donation/:donationId
const getDeliveryByDonation = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({ donationId: req.params.donationId })
            .populate('volunteerId', 'userId deliveryCount rating badge')
            .populate('ngoId', 'orgName address');
            
        if (!delivery) return res.status(404).json({ error: 'Delivery not found for this donation' });
        
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching delivery' });
    }
};

module.exports = { acceptDelivery, confirmPickup, confirmDelivery, rateVolunteer, getMyDeliveries, getPickupPhoto, getDeliveryByDonation };
