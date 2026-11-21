const Venue = require('../models/Venue');
const VenuePhoto = require('../models/VenuePhoto');
const Event = require('../models/Event');

const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;      // per photo, decoded
const MAX_PAYLOAD_BYTES = 3.5 * 1024 * 1024;  // keeps us under Vercel's 4.5 MB body limit
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const EDITABLE_FIELDS = [
    'name', 'description', 'address', 'capacity', 'amenities',
    'contactEmail', 'contactPhone', 'website', 'pricePerDay', 'isAvailable'
];

const ownsVenue = (venue, user) =>
    !!user && (user.role === 'admin' ||
        (venue.managedBy && venue.managedBy.toString() === user.id.toString()));

// Public shape of a photo: bytes are never serialised, only a URL to fetch them.
const photoMeta = (photo) => ({
    _id: photo._id,
    kind: photo.kind,
    caption: photo.caption || '',
    createdAt: photo.createdAt,
    url: photo.kind === 'link' ? photo.url : `/venues/${photo.venue}/photos/${photo._id}`
});

const photosByVenue = async (venueIds) => {
    if (!venueIds.length) return new Map();
    const photos = await VenuePhoto.find({ venue: { $in: venueIds } }).sort({ createdAt: 1, _id: 1 });
    const map = new Map();
    for (const photo of photos) {
        const key = String(photo.venue);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(photo);
    }
    return map;
};

// Cover photo first, then the rest in upload order.
const serializeVenue = (venue, photos = []) => {
    const obj = venue.toObject ? venue.toObject() : { ...venue };
    const coverId = obj.coverPhotoId ? String(obj.coverPhotoId) : '';
    const ordered = coverId
        ? [...photos].sort((a, b) => (String(a._id) === coverId ? -1 : String(b._id) === coverId ? 1 : 0))
        : [...photos];

    obj.photos = ordered.map(photoMeta);
    obj.coverImage = obj.photos[0]?.url || obj.images?.[0] || '';
    delete obj.coverPhotoId;
    return obj;
};

const parseDataUrl = (value) => {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(value).trim());
    if (!match) return null;
    return { contentType: match[1].toLowerCase(), buffer: Buffer.from(match[2], 'base64') };
};

const isHttpUrl = (value) => /^https?:\/\/[^\s]+$/i.test(String(value || '').trim());

exports.getVenues = async (req, res) => {
    try {
        const { page = 1, limit = 12, city, minCapacity, maxCapacity, search } = req.query;
        const query = {};
        if (city) query['address.city'] = { $regex: city, $options: 'i' };
        if (minCapacity || maxCapacity) {
            query.capacity = {};
            if (minCapacity) query.capacity.$gte = parseInt(minCapacity);
            if (maxCapacity) query.capacity.$lte = parseInt(maxCapacity);
        }
        if (search) query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { 'address.city': { $regex: search, $options: 'i' } }
        ];
        const total = await Venue.countDocuments(query);
        const venues = await Venue.find(query)
            .populate('managedBy', 'name email')
            .sort({ rating: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const map = await photosByVenue(venues.map(v => v._id));
        const payload = venues.map(v => serializeVenue(v, map.get(String(v._id)) || []));

        res.json({ success: true, count: payload.length, total, venues: payload });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('managedBy', 'name email avatar')
            .populate('reviews.user', 'name avatar');
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });

        const [map, events] = await Promise.all([
            photosByVenue([venue._id]),
            Event.find({
                venueRef: req.params.id,
                status: 'published',
                endDate: { $gte: new Date() }
            })
                .select('title startDate endDate startTime category currentAttendees maxAttendees')
                .sort({ startDate: 1 })
                .limit(10)
        ]);

        res.json({ success: true, venue: serializeVenue(venue, map.get(String(venue._id)) || []), events });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Serves a stored photo. Public so <img src> works; a photo id never changes, so
// the response is immutable and browser-cacheable.
exports.getVenuePhoto = async (req, res) => {
    try {
        const photo = await VenuePhoto.findOne({ _id: req.params.photoId, venue: req.params.id }).select('+data');
        if (!photo) return res.status(404).json({ success: false, message: 'Photo not found.' });

        if (photo.kind === 'link') {
            if (!isHttpUrl(photo.url)) return res.status(404).json({ success: false, message: 'Photo not found.' });
            return res.redirect(photo.url);
        }
        if (!photo.data || !photo.data.length) {
            return res.status(404).json({ success: false, message: 'Photo not found.' });
        }

        res.set('Content-Type', photo.contentType || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(photo.data);
    } catch (err) {
        // A malformed id is a miss, not a server error.
        if (err.name === 'CastError') return res.status(404).json({ success: false, message: 'Photo not found.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createVenue = async (req, res) => {
    try {
        const payload = {};
        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) payload[field] = req.body[field];
        }
        const venue = await Venue.create({ ...payload, managedBy: req.user.id });
        res.status(201).json({ success: true, venue: serializeVenue(venue, []) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateVenue = async (req, res) => {
    try {
        const existing = await Venue.findById(req.params.id).select('managedBy');
        if (!existing) return res.status(404).json({ success: false, message: 'Venue not found' });
        if (!ownsVenue(existing, req.user))
            return res.status(403).json({ success: false, message: 'Not authorized' });

        // Whitelisted, atomic update: photos, reviews and ownership each have
        // their own endpoints.
        const update = {};
        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) update[field] = req.body[field];
        }
        const venue = await Venue.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
        const map = await photosByVenue([venue._id]);
        res.json({ success: true, venue: serializeVenue(venue, map.get(String(venue._id)) || []) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        if (!ownsVenue(venue, req.user))
            return res.status(403).json({ success: false, message: 'Not authorized' });

        await Promise.all([
            VenuePhoto.deleteMany({ venue: venue._id }),
            venue.deleteOne()
        ]);
        res.json({ success: true, message: 'Venue removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Add photos: either uploaded files (sent as data URLs by the browser) or links.
exports.addVenuePhotos = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id).select('managedBy coverPhotoId');
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        if (!ownsVenue(venue, req.user))
            return res.status(403).json({ success: false, message: 'You can only add photos to venues you manage.' });

        if (JSON.stringify(req.body).length > MAX_PAYLOAD_BYTES)
            return res.status(413).json({ success: false, message: 'Those photos are too large. Try fewer or smaller images.' });

        const existingCount = await VenuePhoto.countDocuments({ venue: venue._id });
        const incoming = Array.isArray(req.body.photos) ? req.body.photos : [req.body];
        const docs = [];
        const rejected = [];

        for (const item of incoming) {
            if (!item) continue;
            if (existingCount + docs.length >= MAX_PHOTOS) {
                rejected.push(`A venue can have up to ${MAX_PHOTOS} photos.`);
                break;
            }
            const caption = String(item.caption || '').slice(0, 120);

            if (item.image) {
                const parsed = parseDataUrl(item.image);
                if (!parsed) { rejected.push('Unsupported image data.'); continue; }
                if (!ALLOWED_MIME.includes(parsed.contentType)) {
                    rejected.push('Photos must be JPEG, PNG or WebP.');
                    continue;
                }
                if (!parsed.buffer.length) { rejected.push('The image could not be read.'); continue; }
                if (parsed.buffer.length > MAX_PHOTO_BYTES) {
                    rejected.push('Each photo must be smaller than 3 MB.');
                    continue;
                }
                docs.push({
                    venue: venue._id,
                    kind: 'upload',
                    data: parsed.buffer,
                    contentType: parsed.contentType,
                    caption,
                    uploadedBy: req.user.id
                });
            } else if (item.url) {
                if (!isHttpUrl(item.url)) { rejected.push('Image links must start with http:// or https://'); continue; }
                docs.push({
                    venue: venue._id,
                    kind: 'link',
                    url: String(item.url).trim(),
                    caption,
                    uploadedBy: req.user.id
                });
            }
        }

        if (!docs.length) {
            return res.status(400).json({
                success: false,
                message: rejected[0] || 'No photos were provided.',
                rejected
            });
        }

        const created = await VenuePhoto.insertMany(docs);

        // The first photo of a venue becomes its cover automatically.
        if (!venue.coverPhotoId) {
            const first = await VenuePhoto.findOne({ venue: venue._id }).sort({ createdAt: 1, _id: 1 });
            if (first) await Venue.updateOne({ _id: venue._id }, { $set: { coverPhotoId: first._id } });
        }

        const map = await photosByVenue([venue._id]);
        const venueDoc = await Venue.findById(venue._id);

        res.status(201).json({
            success: true,
            added: created.length,
            rejected,
            photos: serializeVenue(venueDoc, map.get(String(venue._id)) || []).photos
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteVenuePhoto = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id).select('managedBy coverPhotoId');
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        if (!ownsVenue(venue, req.user))
            return res.status(403).json({ success: false, message: 'Not authorized' });

        const deleted = await VenuePhoto.findOneAndDelete({ _id: req.params.photoId, venue: venue._id });
        if (!deleted) return res.status(404).json({ success: false, message: 'Photo not found' });

        if (venue.coverPhotoId && String(venue.coverPhotoId) === String(deleted._id)) {
            const next = await VenuePhoto.findOne({ venue: venue._id }).sort({ createdAt: 1, _id: 1 });
            await Venue.updateOne({ _id: venue._id }, { $set: { coverPhotoId: next?._id || null } });
        }

        const map = await photosByVenue([venue._id]);
        const venueDoc = await Venue.findById(venue._id);
        res.json({ success: true, photos: serializeVenue(venueDoc, map.get(String(venue._id)) || []).photos });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.setCoverPhoto = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id).select('managedBy');
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        if (!ownsVenue(venue, req.user))
            return res.status(403).json({ success: false, message: 'Not authorized' });

        const photo = await VenuePhoto.findOne({ _id: req.params.photoId, venue: venue._id }).select('_id');
        if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

        await Venue.updateOne({ _id: venue._id }, { $set: { coverPhotoId: photo._id } });

        const map = await photosByVenue([venue._id]);
        const venueDoc = await Venue.findById(venue._id);
        res.json({ success: true, photos: serializeVenue(venueDoc, map.get(String(venue._id)) || []).photos });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addReview = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5)
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        venue.reviews.push({ user: req.user.id, rating, comment });
        const avgRating = venue.reviews.reduce((acc, r) => acc + r.rating, 0) / venue.reviews.length;
        venue.rating = Math.round(avgRating * 10) / 10;
        await Venue.updateOne(
            { _id: venue._id },
            { $set: { reviews: venue.reviews, rating: venue.rating } }
        );
        const updated = await Venue.findById(req.params.id).populate('reviews.user', 'name avatar');
        res.json({ success: true, rating: venue.rating, reviews: updated.reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.likeVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id).select('likes');
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found.' });

        const userIdStr = req.user.id.toString();
        const alreadyLiked = (venue.likes || []).some(id => id.toString() === userIdStr);

        const updated = await Venue.findByIdAndUpdate(
            req.params.id,
            alreadyLiked ? { $pull: { likes: req.user.id } } : { $addToSet: { likes: req.user.id } },
            { new: true }
        ).select('likes');

        res.json({ success: true, likes: updated.likes.length, liked: !alreadyLiked });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
