const express = require('express');
const { acceptDelivery, confirmPickup, confirmDelivery, rateVolunteer, getMyDeliveries, getPickupPhoto, getDeliveryByDonation } = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/my', protect, authorize('volunteer'), getMyDeliveries);
router.get('/donation/:donationId', protect, getDeliveryByDonation);
router.get('/:id/photo', protect, getPickupPhoto);
router.post('/:donationId/accept', protect, authorize('volunteer'), acceptDelivery);
router.patch('/:id/pickup', protect, authorize('volunteer'), upload.single('photo'), confirmPickup);
router.patch('/:id/deliver', protect, authorize('volunteer'), confirmDelivery);
router.post('/:id/rate', protect, authorize('donor', 'ngo'), rateVolunteer);

module.exports = router;
