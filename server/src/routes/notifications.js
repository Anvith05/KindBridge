const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort('-createdAt')
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true }
        );
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
router.patch('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
