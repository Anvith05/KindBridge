const express = require('express');
const { updateLocation, updateStatus, getLeaderboard, uploadId } = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.patch('/location', protect, authorize('volunteer'), updateLocation);
router.patch('/status', protect, authorize('volunteer'), updateStatus);
router.post('/upload-id', protect, authorize('volunteer'), uploadId);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
