const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const NGO = require('../models/NGO');
const Donation = require('../models/Donation');
const NGORequest = require('../models/NGORequest');
const { emitToUser } = require('../utils/socketEmitter');

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort('-createdAt');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

// @desc    Get pending volunteers (verifyStatus = 'pending')
// @route   GET /api/admin/volunteers/pending
const getPendingVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find({ verifyStatus: 'pending' })
            .populate('userId', 'name email phone city createdAt')
            .sort('-createdAt');
        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching pending volunteers' });
    }
};

// @desc    Get all volunteers
// @route   GET /api/admin/volunteers
const getAllVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find()
            .populate('userId', 'name email phone city createdAt')
            .sort('-createdAt');
        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching volunteers' });
    }
};

// @desc    Approve or reject a volunteer
// @route   PATCH /api/admin/volunteers/:id/verify
const verifyVolunteer = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
        }

        const volunteer = await Volunteer.findByIdAndUpdate(
            req.params.id,
            { verifyStatus: status },
            { new: true }
        ).populate('userId', 'name email');

        if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

        // 🔔 Notify the volunteer of their verification result
        if (volunteer.userId) {
            await emitToUser(req, volunteer.userId._id, 'verification:update', {
                message: status === 'approved'
                    ? '🎉 Congratulations! Your volunteer application has been approved. You can now accept deliveries!'
                    : '❌ Your volunteer application has been rejected. Please contact support for more info.',
                status,
            });
        }

        res.json({ message: `Volunteer ${status} successfully`, volunteer });
    } catch (error) {
        res.status(500).json({ error: 'Server error verifying volunteer' });
    }
};

// @desc    Get pending NGOs (verifyStatus = 'pending')
// @route   GET /api/admin/ngos/pending
const getPendingNGOs = async (req, res) => {
    try {
        const ngos = await NGO.find({ verifyStatus: 'pending' })
            .populate('userId', 'name email phone city createdAt')
            .sort('-createdAt');
        res.json(ngos);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching pending NGOs' });
    }
};

// @desc    Get all NGOs
// @route   GET /api/admin/ngos
const getAllNGOs = async (req, res) => {
    try {
        const ngos = await NGO.find()
            .populate('userId', 'name email phone city createdAt')
            .sort('-createdAt');
        res.json(ngos);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching NGOs' });
    }
};

// @desc    Approve or reject an NGO
// @route   PATCH /api/admin/ngos/:id/verify
const verifyNGO = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
        }

        const ngo = await NGO.findByIdAndUpdate(
            req.params.id,
            { verifyStatus: status },
            { new: true }
        ).populate('userId', 'name email');

        if (!ngo) return res.status(404).json({ error: 'NGO not found' });

        // 🔔 Notify the NGO of their verification result
        if (ngo.userId) {
            await emitToUser(req, ngo.userId._id, 'verification:update', {
                message: status === 'approved'
                    ? '🎉 Your NGO application has been approved! You can now receive donations and post requests.'
                    : '❌ Your NGO application has been rejected. Please contact support.',
                status,
            });
        }

        res.json({ message: `NGO ${status} successfully`, ngo });
    } catch (error) {
        res.status(500).json({ error: 'Server error verifying NGO' });
    }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
const getAnalytics = async (req, res) => {
    try {
        const [
            totalUsers,
            totalDonors,
            totalVolunteers,
            totalNGOs,
            totalDonations,
            deliveredDonations,
            totalRequests,
            pendingVolunteers,
            pendingNGOs,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'donor' }),
            User.countDocuments({ role: 'volunteer' }),
            User.countDocuments({ role: 'ngo' }),
            Donation.countDocuments(),
            Donation.countDocuments({ status: 'delivered' }),
            NGORequest.countDocuments(),
            Volunteer.countDocuments({ verifyStatus: 'pending' }),
            NGO.countDocuments({ verifyStatus: 'pending' }),
        ]);

        res.json({
            totalUsers,
            totalDonors,
            totalVolunteers,
            totalNGOs,
            totalDonations,
            deliveredDonations,
            totalRequests,
            pendingVolunteers,
            pendingNGOs,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching analytics' });
    }
};

module.exports = {
    getAllUsers,
    getPendingVolunteers,
    getAllVolunteers,
    verifyVolunteer,
    getPendingNGOs,
    getAllNGOs,
    verifyNGO,
    getAnalytics,
};
