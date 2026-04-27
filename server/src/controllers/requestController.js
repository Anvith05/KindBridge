const NGORequest = require('../models/NGORequest');
const NGO = require('../models/NGO');

// @desc    Get all active requests
// @route   GET /api/requests
const getRequests = async (req, res) => {
    try {
        const requests = await NGORequest.find({ status: 'active' })
            .populate('ngoId', 'orgName address')
            .sort('-createdAt');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching requests' });
    }
};

// @desc    Create a request (NGO only)
// @route   POST /api/requests
const createRequest = async (req, res) => {
    try {
        const ngo = await NGO.findOne({ userId: req.user.id });
        if (!ngo) return res.status(403).json({ error: 'Only verified NGOs can create requests' });

        const request = await NGORequest.create({
            ngoId: ngo._id,
            ...req.body
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ error: 'Server error creating request' });
    }
};

// @desc    Update a request
// @route   PATCH /api/requests/:id
const updateRequest = async (req, res) => {
    try {
        const ngo = await NGO.findOne({ userId: req.user.id });
        if (!ngo && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

        const request = await NGORequest.findOneAndUpdate(
            { _id: req.params.id, ...(req.user.role !== 'admin' && { ngoId: ngo._id }) },
            req.body,
            { new: true }
        );

        if (!request) return res.status(404).json({ error: 'Request not found or unauthorized' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating request' });
    }
};

// @desc    Delete a request
// @route   DELETE /api/requests/:id
const deleteRequest = async (req, res) => {
    try {
        const ngo = await NGO.findOne({ userId: req.user.id });
        if (!ngo && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

        const request = await NGORequest.findOneAndDelete({
            _id: req.params.id,
            ...(req.user.role !== 'admin' && { ngoId: ngo._id })
        });

        if (!request) return res.status(404).json({ error: 'Request not found or unauthorized' });
        res.json({ message: 'Request deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting request' });
    }
};

// @desc    Get request by ID
// @route   GET /api/requests/:id
const getRequestById = async (req, res) => {
    try {
        const request = await NGORequest.findById(req.params.id).populate('ngoId', 'orgName address mission');
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getRequests, createRequest, updateRequest, deleteRequest, getRequestById };
