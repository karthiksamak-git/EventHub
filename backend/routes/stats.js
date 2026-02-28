const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Venue = require('../models/Venue');

const { protect } = require('../middleware/auth');

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

// GET /api/stats/organizer — protected, for organizers
router.get('/organizer', protect, async (req, res) => {
    try {
        // Find all events created by this organizer
        const events = await Event.find({ organizer: req.user.id });
        const eventIds = events.map(e => e._id);

        // Find all confirmed/used tickets for those events
        const tickets = await Ticket.find({
            event: { $in: eventIds },
            status: { $in: ['active', 'used', 'expired'] },
            paymentStatus: 'confirmed'
        });

        const totalRevenue = tickets.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
        const totalTicketsSold = tickets.reduce((acc, t) => acc + t.quantity, 0);

        res.json({
            success: true,
            stats: {
                totalEvents: events.length,
                totalTicketsSold,
                totalRevenue,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

