const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },

    // Account type
    accountType: {
        type: String,
        enum: ['individual', 'organization'],
        default: 'individual'
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'admin'],
        default: 'user'
    },

    organizationName: { type: String, default: '' },
    organizationType: {
        type: String,
        enum: ['company', 'ngo', 'educational', 'government', 'startup', 'community', ''],
        default: ''
    },
    gstin: { type: String, default: '' },
    website: { type: String, default: '' },

    // Payment - UPI ID mandatory for organizers
    upiId: { type: String, default: '' },
    upiVerified: { type: Boolean, default: false },

    // Profile
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    interests: [{ type: String }],
    socialLinks: {
        twitter: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        instagram: { type: String, default: '' },
        website: { type: String, default: '' }
    },

    // Networking
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    connectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
