const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Venue = require('../models/Venue');

// GET /api/stats  — public, no auth needed
router.get('/', async (req, res) => {
    try {
        const [totalEvents, totalUsers, totalTickets, totalVenues] = await Promise.all([
            Event.countDocuments({ status: 'published' }),
            User.countDocuments(),
            Ticket.countDocuments({ status: { $in: ['active', 'used'] } }),
            Venue.countDocuments(),
        ]);

        res.json({
            success: true,
            stats: {
                totalEvents,
                totalUsers,
                totalTickets,
                totalVenues,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
