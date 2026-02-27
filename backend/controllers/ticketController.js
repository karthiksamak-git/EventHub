const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

exports.bookTicket = async (req, res) => {
    try {
        const { eventId, ticketTypeName, quantity = 1, attendeeDetails } = req.body;

        if (!eventId || !ticketTypeName)
            return res.status(400).json({ success: false, message: 'Event and ticket type are required.' });

        const event = await Event.findById(eventId).populate('organizer', 'name upiId');
        if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
        if (event.status !== 'published')
            return res.status(400).json({ success: false, message: 'This event is not accepting bookings.' });

        const ticketType = event.ticketTypes.find(t => t.name === ticketTypeName && t.isActive);
        if (!ticketType)
            return res.status(404).json({ success: false, message: 'Ticket type not found.' });

        const remaining = ticketType.quantity - ticketType.sold;
        if (remaining < quantity)
            return res.status(400).json({
                success: false,
                message: `Only ${remaining} ticket(s) remaining for this type.`
            });

        const existingTicket = await Ticket.findOne({
            event: eventId,
            attendee: req.user.id,
            'ticketType.name': ticketTypeName,
            status: { $in: ['pending_payment', 'active', 'used'] }
        });
        if (existingTicket)
            return res.status(400).json({ success: false, message: 'You already have a ticket for this event.' });

        const totalAmount = ticketType.price * quantity;
        const ticketId = uuidv4();

        let paymentStatus = 'pending';
        let status = 'pending_payment';
        let qrCode = '';
        let paymentConfirmedAt = null;

        if (totalAmount === 0) {
            paymentStatus = 'confirmed';
            status = 'active';
            paymentConfirmedAt = new Date();

            const qrData = `Event: ${event.title}\nAttendee: ${req.user.name}\nTicket: ${ticketTypeName} (Qty: ${quantity})\nID: ${ticketId}\n\nPlease present this QR code at the event entrance for scanning.`;
            qrCode = await QRCode.toDataURL(qrData);
        }

        const ticket = await Ticket.create({
            ticketId,
            event: eventId,
            attendee: req.user.id,
            ticketType: {
                name: ticketType.name,
                price: ticketType.price,
                description: ticketType.description || ''
            },
            quantity,
            totalAmount,
            paymentStatus,
            status,
            qrCode,
            paymentConfirmedAt,
            organizerUpiId: event.organizerUpiId || event.organizer?.upiId || '',
            attendeeDetails: attendeeDetails || {}
        });

        if (totalAmount === 0) {
            await Event.updateOne(
                { _id: eventId, 'ticketTypes.name': ticketTypeName },
                { $inc: { 'ticketTypes.$.sold': quantity, currentAttendees: quantity } }
            );
        }

        res.status(201).json({
            success: true,
            ticket,
            paymentRequired: totalAmount > 0,
            upiPaymentDetails: totalAmount > 0 ? {
                upiId: event.organizerUpiId || event.organizer?.upiId || '',
                amount: totalAmount,
                ticketId,
                note: `EventHub-${ticket._id.toString().slice(-6)}`
            } : null,
            message: totalAmount === 0
                ? 'Your free ticket has been confirmed.'
                : 'Ticket reserved. Please complete payment to confirm your booking.'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.submitPayment = async (req, res) => {
    try {
        const { upiTransactionRef } = req.body;
        if (!upiTransactionRef?.trim())
            return res.status(400).json({ success: false, message: 'UPI transaction reference (UTR) is required.' });

        const ticket = await Ticket.findOne({ _id: req.params.id, attendee: req.user.id });
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
        if (ticket.status !== 'pending_payment')
            return res.status(400).json({ success: false, message: 'This ticket is not awaiting payment.' });
        if (ticket.totalAmount === 0)
            return res.status(400).json({ success: false, message: 'This is a free ticket.' });
        if (ticket.paymentStatus === 'confirmed')
            return res.status(400).json({ success: false, message: 'Payment already confirmed.' });

        ticket.upiTransactionRef = upiTransactionRef.trim();
        ticket.paymentStatus = 'submitted';
        ticket.paymentSubmittedAt = new Date();
        await ticket.save();

        res.json({
            success: true,
            message: 'Payment reference submitted. Your ticket will be confirmed once the organizer verifies the payment.',
            ticket
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.confirmPayment = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('event', 'title organizer')
            .populate('attendee', 'name email');

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

        const organizerId = ticket.event.organizer?._id
            ? ticket.event.organizer._id.toString()
            : ticket.event.organizer.toString();

        if (organizerId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorized.' });

        if (ticket.paymentStatus === 'confirmed')
            return res.status(400).json({ success: false, message: 'Payment already confirmed.' });

        const qrData = `Event: ${ticket.event.title}\nAttendee: ${ticket.attendee.name}\nTicket: ${ticket.ticketType.name} (Qty: ${ticket.quantity})\nID: ${ticket.ticketId}\n\nPlease present this QR code at the event entrance for scanning.`;
        const qrCode = await QRCode.toDataURL(qrData);

        ticket.paymentStatus = 'confirmed';
        ticket.paymentConfirmedAt = new Date();
        ticket.paymentConfirmedBy = req.user.id;
        ticket.status = 'active';
        ticket.qrCode = qrCode;
        await ticket.save();

        await Event.updateOne(
            { _id: ticket.event._id, 'ticketTypes.name': ticket.ticketType.name },
            { $inc: { 'ticketTypes.$.sold': ticket.quantity, currentAttendees: ticket.quantity } }
        );

        res.json({ success: true, message: 'Payment confirmed. Ticket is now active.', ticket });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.rejectPayment = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('event', 'organizer');
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

        const organizerId = ticket.event.organizer?._id
            ? ticket.event.organizer._id.toString()
            : ticket.event.organizer.toString();

        if (organizerId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorized.' });

        ticket.paymentStatus = 'failed';
        ticket.status = 'pending_payment';
        ticket.upiTransactionRef = '';
        ticket.paymentSubmittedAt = null;
        await ticket.save();

        res.json({ success: true, message: 'Payment rejected. Attendee can resubmit their reference.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ attendee: req.user.id })
            .populate('event', 'title startDate endDate startTime category isOnline physicalLocation status')
            .sort({ createdAt: -1 });
        res.json({ success: true, tickets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('event', 'title startDate startTime category isOnline physicalLocation onlineLink organizer')
            .populate('attendee', 'name email');

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

        const event = await Event.findById(ticket.event._id);
        const isOrganizer = event.organizer.toString() === req.user.id;
        const isAttendee = ticket.attendee._id.toString() === req.user.id;
        if (!isAttendee && !isOrganizer && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorized.' });

        res.json({ success: true, ticket });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEventTickets = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorized.' });

        const tickets = await Ticket.find({ event: req.params.eventId })
            .populate('attendee', 'name email phone avatar accountType organizationName')
            .sort({ createdAt: -1 });

        res.json({ success: true, tickets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.cancelTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, attendee: req.user.id });
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
        if (ticket.status === 'used')
            return res.status(400).json({ success: false, message: 'Cannot cancel a used ticket.' });

        const wasActive = ticket.status === 'active';
        ticket.status = 'cancelled';
        ticket.paymentStatus = ticket.paymentStatus === 'confirmed' ? 'refunded' : ticket.paymentStatus;
        await ticket.save();

        if (wasActive) {
            await Event.updateOne(
                { _id: ticket.event, 'ticketTypes.name': ticket.ticketType.name },
                { $inc: { 'ticketTypes.$.sold': -ticket.quantity, currentAttendees: -ticket.quantity } }
            );
        }

        res.json({ success: true, message: 'Ticket cancelled successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
