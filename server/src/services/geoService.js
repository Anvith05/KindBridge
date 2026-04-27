const Volunteer = require('../models/Volunteer');

/**
 * Find approved volunteers within a given radius of a location.
 * @param {[Number, Number]} coordinates - [longitude, latitude]
 * @param {Number} radiusKm - radius in kilometers (default 5)
 * @returns {Promise<Array>} matching volunteer documents
 */
const findNearbyVolunteers = async (coordinates, radiusKm = 5) => {
    if (!coordinates || coordinates.length !== 2) return [];

    try {
        const volunteers = await Volunteer.find({
            verifyStatus: 'approved',
            'location.coordinates': {
                $geoWithin: {
                    $centerSphere: [coordinates, radiusKm / 6378.1] // Earth radius in km
                },
            },
        }).populate('userId', 'name email');

        return volunteers;
    } catch (error) {
        console.error('Geo-matching error:', error.message);
        return [];
    }
};

module.exports = { findNearbyVolunteers };
