const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },

    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    ticketType: {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String, default: '' }
    },
    quantity: { type: Number, default: 1, min: 1 },
    totalAmount: { type: Number, required: true },

    paymentStatus: {
        type: String,
        enum: ['pending', 'submitted', 'confirmed', 'failed', 'refunded'],
        default: 'pending'
    },

    organizerUpiId: { type: String, default: '' },
    upiTransactionRef: { type: String, default: '' },
    paymentSubmittedAt: { type: Date },
    paymentConfirmedAt: { type: Date },
    paymentConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: {
        type: String,
        enum: ['pending_payment', 'active', 'cancelled', 'used', 'expired'],
        default: 'pending_payment'
    },

    qrCode: { type: String, default: '' },

    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    attendeeDetails: {
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' }
    },

    notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
