const Event = require('../models/Event');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

exports.getEvents = async (req, res) => {
    try {
        const {
            page = 1, limit = 12, category, search, status = 'published',
            isOnline, startFrom, startTo, sort = 'startDate', tags
        } = req.query;

        const query = { status };
        if (category && category !== 'all') query.category = category;
        if (isOnline !== undefined) query.isOnline = isOnline === 'true';
        if (tags) query.tags = { $in: tags.split(',') };
        if (startFrom || startTo) {
            query.startDate = {};
            if (startFrom) query.startDate.$gte = new Date(startFrom);
            if (startTo) query.startDate.$lte = new Date(startTo);
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { 'physicalLocation.city': { $regex: search, $options: 'i' } },
                { 'physicalLocation.country': { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {
            startDate: { startDate: 1 },
            '-startDate': { startDate: -1 },
            newest: { createdAt: -1 },
            price: { 'ticketTypes.0.price': 1 },
            popular: { currentAttendees: -1 }
        };

        const events = await Event.find(query)
            .populate('organizer', 'name email avatar accountType organizationName upiId')
            .sort(sortOptions[sort] || { startDate: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Event.countDocuments(query);
        res.json({ success: true, events, total, pages: Math.ceil(total / limit), page: Number(page) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email avatar accountType organizationName upiId upiVerified bio phone socialLinks website')
            .populate('comments.user', 'name avatar');
        if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
        res.json({ success: true, event });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const organizer = await User.findById(req.user.id);

        const hasPaidTickets = (req.body.ticketTypes || []).some(t => Number(t.price) > 0);
        if (hasPaidTickets && !organizer.upiId) {
            return res.status(400).json({
                success: false,
                message: 'You must set up your UPI ID in your profile before creating events with paid tickets.'
            });
        }

        const {
            title, description, category, isOnline, onlineLink, onlinePlatform,
            physicalLocation, startDate, endDate, startTime, endTime, timezone,
            ticketTypes, maxAttendees, tags, status, isFeatured,
            requirements, refundPolicy, ageRestriction, language
        } = req.body;

        if (!title || !description || !category || !startDate || !endDate || !startTime || !endTime)
            return res.status(400).json({ success: false, message: 'Please fill all required fields.' });

        if (isOnline && !onlineLink)
            return res.status(400).json({ success: false, message: 'Online link is required for online events.' });

        if (!isOnline) {
            if (!physicalLocation?.city || !physicalLocation?.country)
                return res.status(400).json({ success: false, message: 'City and country are required for in-person events.' });
        }

        if (!ticketTypes || ticketTypes.length === 0)
            return res.status(400).json({ success: false, message: 'At least one ticket type is required.' });

        const checkInCode = uuidv4();

        const eventData = {
            title, description, category,
            isOnline: !!isOnline,
            onlineLink: isOnline ? onlineLink : '',
            onlinePlatform: isOnline ? (onlinePlatform || '') : '',
            physicalLocation: isOnline ? {} : physicalLocation,
            startDate, endDate, startTime, endTime,
            timezone: timezone || 'Asia/Kolkata',
            ticketTypes, maxAttendees: maxAttendees || 0,
            tags: tags || [],
            status: status || 'draft',
            isFeatured: isFeatured || false,
            requirements: requirements || '',
            refundPolicy: refundPolicy || '',
            ageRestriction: ageRestriction || '',
            language: language || 'English',
            organizer: req.user.id,
            organizerUpiId: organizer.upiId || '',
            checkInCode
        };

        const event = await Event.create(eventData);
        const populated = await event.populate('organizer', 'name email avatar accountType organizationName');
        res.status(201).json({ success: true, event: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'You are not authorized to update this event.' });

        const forbiddenFields = ['organizer', 'checkInCode', 'currentAttendees'];
        forbiddenFields.forEach(f => delete req.body[f]);

        if (req.body.isOnline === false || req.body.isOnline === 'false') {
            if (!req.body.physicalLocation?.city)
                return res.status(400).json({ success: false, message: 'City is required for in-person events.' });
            req.body.onlineLink = '';
            req.body.onlinePlatform = '';
        }
        if (req.body.isOnline === true || req.body.isOnline === 'true') {
            req.body.physicalLocation = {};
        }

        const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('organizer', 'name email avatar accountType organizationName');
        res.json({ success: true, event: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        await event.deleteOne();
        res.json({ success: true, message: 'Event deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.likeEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

        const userIdStr = req.user.id.toString();
        const likesStrings = event.likes.map(id => id.toString());
        const idx = likesStrings.indexOf(userIdStr);

        if (idx > -1) {
            event.likes.splice(idx, 1);
        } else {
            event.likes.push(req.user.id);
        }

        await event.save();
        res.json({ success: true, likes: event.likes.length, liked: idx === -1 });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text is required.' });
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { user: req.user.id, text: text.trim() } } },
            { new: true }
        ).populate('comments.user', 'name avatar');
        res.json({ success: true, comments: event.comments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCalendarEvents = async (req, res) => {
    try {
        const { month, year } = req.query;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const events = await Event.find({
            status: 'published',
            startDate: { $gte: start, $lte: end }
        }).select('title startDate endDate category isOnline physicalLocation').lean();
        res.json({ success: true, events });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.id })
            .sort({ createdAt: -1 })
            .populate('organizer', 'name email');
        res.json({ success: true, events });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
