const express = require('express');
const { getRequests, createRequest, updateRequest, deleteRequest, getRequestById } = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(getRequests)
    .post(protect, authorize('ngo'), createRequest);

router.route('/:id')
    .get(getRequestById)
    .patch(protect, authorize('ngo', 'admin'), updateRequest)
    .delete(protect, authorize('ngo', 'admin'), deleteRequest);

module.exports = router;
