const express = require('express');
const { recordAdWatch, getMyStats, getLeaderboard, getGlobalStats } = require('../controllers/adWatchController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/watch', protect, authorize('donor'), recordAdWatch);
router.get('/stats', protect, authorize('donor'), getMyStats);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/global', getGlobalStats);

module.exports = router;
