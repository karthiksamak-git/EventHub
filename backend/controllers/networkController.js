const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

exports.getSuggestions = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const suggestions = await User.find({
            _id: { $ne: req.user.id, $nin: currentUser.connections, $nin: currentUser.connectionRequests },
            isActive: true,
            $or: [
                { interests: { $in: currentUser.interests } },
                { location: currentUser.location }
            ]
        }).select('name avatar bio location interests role').limit(20);
        res.json({ success: true, suggestions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.sendConnectionRequest = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
        if (targetUser.connectionRequests.includes(req.user.id))
            return res.status(400).json({ success: false, message: 'Request already sent' });
        if (targetUser.connections.includes(req.user.id))
            return res.status(400).json({ success: false, message: 'Already connected' });
        targetUser.connectionRequests.push(req.user.id);
        await targetUser.save();
        res.json({ success: true, message: 'Connection request sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.acceptConnection = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const requester = await User.findById(req.params.userId);
        if (!requester) return res.status(404).json({ success: false, message: 'User not found' });
        if (!currentUser.connectionRequests.includes(req.params.userId))
            return res.status(400).json({ success: false, message: 'No connection request from this user' });
        currentUser.connectionRequests = currentUser.connectionRequests.filter(id => id.toString() !== req.params.userId);
        currentUser.connections.push(req.params.userId);
        requester.connections.push(req.user.id);
        await currentUser.save();
        await requester.save();
        res.json({ success: true, message: 'Connection accepted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.removeConnection = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { $pull: { connections: req.params.userId } });
        await User.findByIdAndUpdate(req.params.userId, { $pull: { connections: req.user.id } });
        res.json({ success: true, message: 'Connection removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getConnections = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('connections', 'name avatar bio location interests role');
        const requests = await User.find({ _id: { $in: user.connectionRequests } }).select('name avatar bio location');
        res.json({ success: true, connections: user.connections, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEventAttendees = async (req, res) => {
    try {
        const tickets = await Ticket.find({ event: req.params.eventId, status: { $ne: 'cancelled' } })
            .populate('attendee', 'name avatar bio location interests');
        const attendees = tickets.map(t => t.attendee).filter(Boolean);
        res.json({ success: true, attendees });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
