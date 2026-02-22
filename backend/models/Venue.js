const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    // Full address - completely free-form, any location on earth
    address: {
        line1: { type: String, required: true },
        line2: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, default: '' },
        landmark: { type: String, default: '' },
        // Geographic coordinates (optional, for map integration)
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },

    capacity: { type: Number, required: true },
    amenities: [{ type: String }],
    images: [{ type: String }],
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    website: { type: String, default: '' },
    pricePerDay: { type: Number, default: 0 },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '' },
        date: { type: Date, default: Date.now }
    }],

    isAvailable: { type: Boolean, default: true },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    bookings: [{
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
        startDate: { type: Date },
        endDate: { type: Date }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Venue', VenueSchema);
