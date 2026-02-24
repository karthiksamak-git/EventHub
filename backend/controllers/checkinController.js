const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

exports.checkIn = async (req, res) => {
    try {
        const { ticketId, eventId } = req.body;
        const ticket = await Ticket.findOne({ ticketId })
            .populate('attendee', 'name email avatar')
            .populate('event', 'title startDate organizer');

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found. Please verify the ticket ID.' });

        const organizerId = ticket.event.organizer?._id
            ? ticket.event.organizer._id.toString()
            : ticket.event.organizer.toString();

        if (organizerId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'You are not authorized to check in attendees for this event.' });

        if (eventId && ticket.event._id.toString() !== eventId)
            return res.status(400).json({ success: false, message: 'This ticket does not belong to the selected event.' });

        if (ticket.status === 'cancelled')
            return res.status(400).json({ success: false, message: 'This ticket has been cancelled.' });

        if (ticket.status === 'pending_payment')
            return res.status(400).json({ success: false, message: 'Payment has not been confirmed for this ticket yet.' });

        if (ticket.checkedIn)
            return res.status(400).json({ success: false, message: `${ticket.attendee.name} has already been checked in.`, ticket });

        ticket.checkedIn = true;
        ticket.checkedInAt = new Date();
        ticket.checkedInBy = req.user.id;
        ticket.status = 'used';
        await ticket.save();

        res.json({
            success: true,
            message: `${ticket.attendee.name} checked in successfully.`,
            ticket
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCheckInStats = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

        const organizerId = event.organizer?._id
            ? event.organizer._id.toString()
            : event.organizer.toString();

        if (organizerId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorized.' });

        const totalTickets = await Ticket.countDocuments({
            event: req.params.eventId,
            status: { $in: ['active', 'used'] }
        });
        const checkedIn = await Ticket.countDocuments({ event: req.params.eventId, checkedIn: true });
        const recentCheckins = await Ticket.find({ event: req.params.eventId, checkedIn: true })
            .populate('attendee', 'name email avatar')
            .sort({ checkedInAt: -1 })
            .limit(15);

        res.json({
            success: true,
            stats: {
                totalTickets,
                checkedIn,
                remaining: totalTickets - checkedIn,
                percentage: totalTickets ? Math.round((checkedIn / totalTickets) * 100) : 0
            },
            recentCheckins
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
