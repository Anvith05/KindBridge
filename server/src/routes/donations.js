const express = require('express');
const { getDonations, createDonation, getDonationById, updateDonation, deleteDonation, getMyDonations, getDonationMatches } = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(getDonations)
    .post(protect, authorize('donor'), createDonation);

router.get('/my', protect, getMyDonations);
router.get('/:id/matches', protect, authorize('donor', 'admin'), getDonationMatches);

router.route('/:id')
    .get(getDonationById)
    .patch(protect, authorize('donor', 'admin'), updateDonation)
    .delete(protect, authorize('donor', 'admin'), deleteDonation);

module.exports = router;
