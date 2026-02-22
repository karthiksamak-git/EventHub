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

    // ===== PAYMENT =====
    paymentStatus: {
        type: String,
        enum: ['pending', 'submitted', 'confirmed', 'failed', 'refunded'],
        default: 'pending'
    },

    organizerUpiId: { type: String, default: '' },
    // UPI transaction reference entered by the attendee after paying
    upiTransactionRef: { type: String, default: '' },
    // When the attendee submitted the UTR
    paymentSubmittedAt: { type: Date },
    // When organizer or system confirmed
    paymentConfirmedAt: { type: Date },
    paymentConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: {
        type: String,
        enum: ['pending_payment', 'active', 'cancelled', 'used', 'expired'],
        default: 'pending_payment'
    },

    qrCode: { type: String, default: '' },

    // Check-in
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
