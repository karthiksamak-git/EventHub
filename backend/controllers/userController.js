const User = require('../models/User');
const Ticket = require('../models/Ticket');

exports.getUsers = async (req, res) => {
    try {
        const { search, interests, page = 1, limit = 20 } = req.query;
        const query = { _id: { $ne: req.user.id }, isActive: true };
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        if (interests) query.interests = { $in: interests.split(',') };
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('name avatar bio location interests role connections')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        res.json({ success: true, total, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('connections', 'name avatar bio');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUserEvents = async (req, res) => {
    try {
        const tickets = await Ticket.find({ attendee: req.params.id })
            .populate('event', 'title startDate coverImage category status')
            .sort({ createdAt: -1 });
        res.json({ success: true, events: tickets.map(t => t.event) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
