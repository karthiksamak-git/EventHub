const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['conference', 'workshop', 'concert', 'sports', 'networking', 'festival', 'exhibition', 'seminar', 'hackathon', 'webinar', 'other'],
        required: true
    },
    coverImage: { type: String, default: '' },
    images: [{ type: String }],

    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    isOnline: { type: Boolean, default: false },
    onlineLink: { type: String, default: '' },
    onlinePlatform: { type: String, default: '' }, // e.g. Zoom, Google Meet, MS Teams

    // Physical location — free-text, no venue dependency
    physicalLocation: {
        addressLine1: { type: String, default: '' },
        addressLine2: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        landmark: { type: String, default: '' }
    },

    // Optional venue reference (only if venue is selected from the venue directory)
    // Entirely optional — not required even for physical events
    venueRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },

    ticketTypes: [{
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        sold: { type: Number, default: 0 },
        description: { type: String, default: '' },
        benefits: [{ type: String }],
        isActive: { type: Boolean, default: true }
    }],
    maxAttendees: { type: Number, default: 0 },
    currentAttendees: { type: Number, default: 0 },

    // Payment — organizer's UPI ID (copied from organizer's profile at event creation)

    organizerUpiId: { type: String, default: '' },

    // Meta
    tags: [{ type: String }],
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
        default: 'draft'
    },
    isFeatured: { type: Boolean, default: false },
    requirements: { type: String, default: '' },
    refundPolicy: { type: String, default: '' },
    ageRestriction: { type: String, default: '' },
    language: { type: String, default: 'English' },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }],

    checkInCode: { type: String, unique: true, sparse: true }
}, { timestamps: true });

EventSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Event', EventSchema);
