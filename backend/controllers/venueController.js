const Venue = require('../models/Venue');

exports.getVenues = async (req, res) => {
    try {
        const { page = 1, limit = 12, city, minCapacity, maxCapacity, search } = req.query;
        const query = { isAvailable: true };
        if (city) query['address.city'] = { $regex: city, $options: 'i' };
        if (minCapacity || maxCapacity) {
            query.capacity = {};
            if (minCapacity) query.capacity.$gte = parseInt(minCapacity);
            if (maxCapacity) query.capacity.$lte = parseInt(maxCapacity);
        }
        if (search) query.name = { $regex: search, $options: 'i' };
        const total = await Venue.countDocuments(query);
        const venues = await Venue.find(query)
            .populate('managedBy', 'name email')
            .sort({ rating: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        res.json({ success: true, count: venues.length, total, venues });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('managedBy', 'name email avatar')
            .populate('reviews.user', 'name avatar')
            .populate('bookings.eventId', 'title startDate endDate');
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        res.json({ success: true, venue });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createVenue = async (req, res) => {
    try {
        const venue = await Venue.create({ ...req.body, managedBy: req.user.id });
        res.status(201).json({ success: true, venue });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateVenue = async (req, res) => {
    try {
        let venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        if (venue.managedBy.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorized' });
        venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, venue });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        if (venue.managedBy.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorized' });
        await venue.deleteOne();
        res.json({ success: true, message: 'Venue removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addReview = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        const { rating, comment } = req.body;
        venue.reviews.push({ user: req.user.id, rating, comment });
        const avgRating = venue.reviews.reduce((acc, r) => acc + r.rating, 0) / venue.reviews.length;
        venue.rating = Math.round(avgRating * 10) / 10;
        await venue.save();
        res.json({ success: true, rating: venue.rating, reviews: venue.reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
