const Volunteer = require('../models/Volunteer');

// @desc    Update volunteer location
// @route   PATCH /api/volunteers/location
const updateLocation = async (req, res) => {
    try {
        const { coordinates } = req.body; // [lng, lat]
        if (!coordinates) return res.status(400).json({ error: 'Coordinates are required' });

        const volunteer = await Volunteer.findOneAndUpdate(
            { userId: req.user.id },
            { location: { type: 'Point', coordinates } },
            { new: true }
        );

        if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });
        res.json(volunteer);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating location' });
    }
};

// @desc    Update volunteer status (e.g. going off-duty)
// @route   PATCH /api/volunteers/status
const updateStatus = async (req, res) => {
    // Placeholder for simpler status logic (could be adding 'isAvailable' to schema later)
    res.json({ message: 'Status updated' });
};

// @desc    Get volunteer leaderboard
// @route   GET /api/volunteers/leaderboard
const getLeaderboard = async (req, res) => {
    try {
        const leaders = await Volunteer.find({ verifyStatus: 'approved' })
            .populate('userId', 'name')
            .sort('-deliveryCount -rating')
            .limit(10);

        res.json(leaders);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching leaderboard' });
    }
};

// @desc    Upload ID Document
// @route   POST /api/volunteers/upload-id
const uploadId = async (req, res) => {
    // We'll configure Multer here later; returning placeholder success
    res.json({ message: 'ID uploaded successfully, pending verification' });
};

module.exports = { updateLocation, updateStatus, getLeaderboard, uploadId };
