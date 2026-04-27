const express = require('express');
const {
    getAllUsers,
    getPendingVolunteers,
    getAllVolunteers,
    verifyVolunteer,
    getPendingNGOs,
    getAllNGOs,
    verifyNGO,
    getAnalytics,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.get('/analytics', getAnalytics);

// Volunteer verification
router.get('/volunteers', getAllVolunteers);
router.get('/volunteers/pending', getPendingVolunteers);
router.patch('/volunteers/:id/verify', verifyVolunteer);

// NGO verification
router.get('/ngos', getAllNGOs);
router.get('/ngos/pending', getPendingNGOs);
router.patch('/ngos/:id/verify', verifyNGO);

module.exports = router;
