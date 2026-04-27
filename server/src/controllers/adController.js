const SponsorAd = require('../models/SponsorAd');
const AdView = require('../models/AdView');
const User = require('../models/User');

// Get active ads
// GET /api/ads
const getActiveAds = async (req, res) => {
    try {
        const ads = await SponsorAd.find({ isActive: true });
        res.json(ads);
    } catch (error) {
        console.error('Error fetching ads:', error.message);
        res.status(500).json({ error: 'Server error fetching ads' });
    }
};

// Record a completed ad view and credit balance
// POST /api/ads/:id/complete
const completeAdView = async (req, res) => {
    try {
        const ad = await SponsorAd.findById(req.params.id);
        if (!ad || !ad.isActive) {
            return res.status(404).json({ error: 'Ad not found or inactive' });
        }

        const { durationSeconds } = req.body;
        const safeDuration = Math.max(0, Math.min(durationSeconds || 0, 600)); // cap at 10 min
        const amount = Number((safeDuration * ad.payoutPerSecond).toFixed(2));

        // Check remaining budget
        if (ad.totalSpent + amount > ad.maxBudget) {
            return res.status(400).json({ error: 'Ad budget exhausted' });
        }

        const view = await AdView.create({
            userId: req.user.id,
            adId: ad._id,
            durationSeconds: safeDuration,
            amountEarned: amount,
        });

        // Update ad spend and user ad balance
        ad.totalSpent += amount;
        await ad.save();

        await User.findByIdAndUpdate(req.user.id, { $inc: { adBalance: amount } });

        res.status(201).json({ view, newAmount: amount });
    } catch (error) {
        console.error('Error completing ad view:', error.message);
        res.status(500).json({ error: 'Server error completing ad view' });
    }
};

// Get my ad stats
// GET /api/ads/stats/me
const getMyAdStats = async (req, res) => {
    try {
        const [views, user] = await Promise.all([
            AdView.find({ userId: req.user.id }),
            User.findById(req.user.id).select('adBalance name'),
        ]);

        const totalEarned = views.reduce((sum, v) => sum + v.amountEarned, 0);
        const totalSeconds = views.reduce((sum, v) => sum + v.durationSeconds, 0);

        res.json({
            name: user?.name,
            adBalance: user?.adBalance || 0,
            totalEarned,
            totalSeconds,
            viewsCount: views.length,
        });
    } catch (error) {
        console.error('Error fetching ad stats:', error.message);
        res.status(500).json({ error: 'Server error fetching ad stats' });
    }
};

// Leaderboard: top users by total earned from ads
// GET /api/ads/leaderboard
const getAdLeaderboard = async (req, res) => {
    try {
        const leaderboard = await AdView.aggregate([
            {
                $group: {
                    _id: '$userId',
                    totalEarned: { $sum: '$amountEarned' },
                    totalSeconds: { $sum: '$durationSeconds' },
                },
            },
            { $sort: { totalEarned: -1 } },
            { $limit: 20 },
        ]);

        const populated = await User.populate(leaderboard, {
            path: '_id',
            select: 'name city',
        });

        const result = populated.map((item) => ({
            userId: item._id._id,
            name: item._id.name,
            city: item._id.city,
            totalEarned: item.totalEarned,
            totalSeconds: item.totalSeconds,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching ad leaderboard:', error.message);
        res.status(500).json({ error: 'Server error fetching ad leaderboard' });
    }
};

module.exports = {
    getActiveAds,
    completeAdView,
    getMyAdStats,
    getAdLeaderboard,
};
