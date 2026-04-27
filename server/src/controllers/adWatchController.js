const AdWatch = require('../models/AdWatch');
const User = require('../models/User');

// @desc    Record an ad watch
// @route   POST /api/ad-watch/watch
const recordAdWatch = async (req, res) => {
    try {
        const { adSlotId } = req.body;
        
        if (!adSlotId) {
            return res.status(400).json({ error: 'adSlotId is required' });
        }

        // Simple validation: Ensure they haven't watched this exact slot in the last 15 seconds
        const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
        const recentWatch = await AdWatch.findOne({
            userId: req.user.id,
            adSlotId,
            createdAt: { $gte: fifteenSecondsAgo }
        });

        if (recentWatch) {
            return res.status(429).json({ error: 'Please wait before watching another ad in this slot.' });
        }

        const adWatch = await AdWatch.create({
            userId: req.user.id,
            adSlotId,
            earnedAmount: 2, // Always Rs. 2 for this demo
        });

        res.status(201).json(adWatch);
    } catch (error) {
        console.error('Record AdWatch error:', error);
        res.status(500).json({ error: 'Server error recording ad watch' });
    }
};

// @desc    Get user's ad watch stats
// @route   GET /api/ad-watch/stats
const getMyStats = async (req, res) => {
    try {
        const stats = await AdWatch.aggregate([
            { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(req.user.id) } },
            {
                $group: {
                    _id: null,
                    totalEarned: { $sum: "$earnedAmount" },
                    totalViews: { $sum: 1 }
                }
            }
        ]);

        res.json({
            earned: stats.length > 0 ? stats[0].totalEarned : 0,
            views: stats.length > 0 ? stats[0].totalViews : 0
        });
    } catch (error) {
        console.error('Get Stats error:', error);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
};

// @desc    Get ad watch leaderboard
// @route   GET /api/ad-watch/leaderboard
const getLeaderboard = async (req, res) => {
    try {
        const { period } = req.query; // 'weekly' or 'all-time'
        
        const matchStage = {};
        if (period === 'weekly') {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            matchStage.createdAt = { $gte: sevenDaysAgo };
        }

        const leaders = await AdWatch.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$userId",
                    totalEarned: { $sum: "$earnedAmount" },
                    totalViews: { $sum: 1 }
                }
            },
            { $sort: { totalEarned: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    userId: "$_id",
                    name: "$user.name",
                    totalEarned: 1,
                    totalViews: 1,
                    _id: 0
                }
            }
        ]);

        res.json(leaders);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Server error fetching leaderboard' });
    }
};

// @desc    Get global ad watch stats
// @route   GET /api/ad-watch/global
const getGlobalStats = async (req, res) => {
    try {
        const stats = await AdWatch.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarned: { $sum: "$earnedAmount" },
                    totalViews: { $sum: 1 }
                }
            }
        ]);

        res.json({
            globalEarned: stats.length > 0 ? stats[0].totalEarned : 0,
            globalViews: stats.length > 0 ? stats[0].totalViews : 0
        });
    } catch (error) {
        console.error('Global Stats error:', error);
        res.status(500).json({ error: 'Server error fetching global stats' });
    }
};

module.exports = { recordAdWatch, getMyStats, getLeaderboard, getGlobalStats };
