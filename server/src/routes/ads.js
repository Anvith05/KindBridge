const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    getActiveAds,
    completeAdView,
    getMyAdStats,
    getAdLeaderboard,
} = require('../controllers/adController');

const router = express.Router();

// Public: list active ads (but front-end should still send token for user-specific actions)
router.get('/', getActiveAds);

// Donor-only: complete an ad view and earn money
router.post('/:id/complete', protect, authorize('donor'), completeAdView);

// Donor-only: my stats
router.get('/stats/me', protect, authorize('donor'), getMyAdStats);

// Admin + donor can see leaderboard
router.get('/leaderboard', protect, authorize('donor', 'admin'), getAdLeaderboard);

module.exports = router;
