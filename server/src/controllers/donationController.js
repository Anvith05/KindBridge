const Donation = require('../models/Donation');
const { findNearbyVolunteers } = require('../services/geoService');
const { emitToUser } = require('../utils/socketEmitter');
const { findMatchingNgos } = require('../services/ngoMatchService');

// @desc    Get all donations (with optional filters)
// @route   GET /api/donations
const getDonations = async (req, res) => {
    try {
        const filters = { status: 'available' };

        // Optional filters based on query
        if (req.query.category) filters.category = req.query.category;
        if (req.query.condition) filters.condition = req.query.condition;

        const donations = await Donation.find(filters).populate('donorId', 'name email').sort('-createdAt');
        res.json(donations);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching donations' });
    }
};

// @desc    Create a new donation
// @route   POST /api/donations
const createDonation = async (req, res) => {
    try {
        const { title, category, description, condition, pickupAddress, coordinates, availabilityFrom, availabilityTo } = req.body;

        const donation = await Donation.create({
            donorId: req.user.id,
            title,
            category,
            description,
            condition,
            pickupAddress,
            location: coordinates ? { type: 'Point', coordinates } : undefined, // [lng, lat]
            availabilityFrom,
            availabilityTo,
        });

        res.status(201).json(donation);

        // Asynchronously notify nearby volunteers (non-blocking)
        if (coordinates && coordinates.length === 2) {
            findNearbyVolunteers(coordinates, 5).then(async (nearbyVols) => {
                for (const vol of nearbyVols) {
                    await emitToUser(req, vol.userId._id || vol.userId, 'donation:nearby', {
                        message: `New donation \"${title}\" is available near you! Tap to view.`,
                        donationId: donation._id,
                    });
                }
                if (nearbyVols.length > 0) {
                    console.log(`📍 Notified ${nearbyVols.length} nearby volunteer(s) about donation "${title}"`);
                }
            }).catch(() => {});
        }
    } catch (error) {
        console.error('Error creating donation:', error.message);
        res.status(500).json({ error: 'Server error creating donation' });
    }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
const getDonationById = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id).populate('donorId', 'name phone email');
        if (!donation) return res.status(404).json({ error: 'Donation not found' });
        res.json(donation);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching donation' });
    }
};

// @desc    Update a donation
// @route   PATCH /api/donations/:id
const updateDonation = async (req, res) => {
    try {
        let donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ error: 'Donation not found' });

        // Check ownership
        if (donation.donorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this donation' });
        }

        donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(donation);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating donation' });
    }
};

// @desc    Delete a donation
// @route   DELETE /api/donations/:id
const deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ error: 'Donation not found' });

        if (donation.donorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this donation' });
        }

        await donation.deleteOne();
        res.json({ message: 'Donation removed' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting donation' });
    }
};

// @desc    Get logged in user's donations
// @route   GET /api/donations/my
const getMyDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ donorId: req.user.id }).sort('-createdAt');
        res.json(donations);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching user donations' });
    }
};

// @desc    Get recommended NGOs for a donation (category + nearby)
// @route   GET /api/donations/:id/matches
const getDonationMatches = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ error: 'Donation not found' });

        // Only donor who created it or admin can view matches
        if (donation.donorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to view matches for this donation' });
        }

        const coords = donation.location?.coordinates;
        const ngos = await findMatchingNgos(coords, donation.category);

        res.json(ngos);
    } catch (error) {
        console.error('Error fetching donation matches:', error.message);
        res.status(500).json({ error: 'Server error fetching donation matches' });
    }
};

module.exports = { getDonations, createDonation, getDonationById, updateDonation, deleteDonation, getMyDonations, getDonationMatches };
