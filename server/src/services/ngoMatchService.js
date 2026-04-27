const NGO = require('../models/NGO');

/**
 * Find approved NGOs near a donation location and matching its category.
 * @param {[number, number]} coordinates - [longitude, latitude]
 * @param {string} category - donation category
 * @param {number} radiusKm - radius in kilometers (default 10)
 * @returns {Promise<Array>} matching NGO documents
 */
const findMatchingNgos = async (coordinates, category, radiusKm = 10) => {
    if (!coordinates || coordinates.length !== 2) return [];

    try {
        const ngos = await NGO.find({
            verifyStatus: 'approved',
            acceptedCategories: { $in: [category] },
            'location.coordinates': {
                $geoWithin: {
                    $centerSphere: [coordinates, radiusKm / 6378.1], // Earth radius in km
                },
            },
        });

        return ngos;
    } catch (error) {
        console.error('NGO matching error:', error.message);
        return [];
    }
};

module.exports = { findMatchingNgos };
