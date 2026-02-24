const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, accountType, organizationName, organizationType } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });

        if (password.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

        const existing = await User.findOne({ email });
        if (existing)
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

        if (accountType === 'organization' && !organizationName)
            return res.status(400).json({ success: false, message: 'Organization name is required for organization accounts.' });

        const userData = {
            name,
            email,
            password,
            phone: phone || '',
            accountType: accountType || 'individual',
            role: accountType === 'organization' ? 'organizer' : 'user'
        };
        if (accountType === 'organization') {
            userData.organizationName = organizationName;
            userData.organizationType = organizationType || '';
        }

        const user = await User.create(userData);
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id, name: user.name, email: user.email,
                role: user.role, accountType: user.accountType,
                organizationName: user.organizationName,
                upiId: user.upiId, upiVerified: user.upiVerified
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required.' });

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password)))
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        if (!user.isActive)
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });

        const token = generateToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                id: user._id, name: user.name, email: user.email,
                role: user.role, accountType: user.accountType,
                organizationName: user.organizationName,
                upiId: user.upiId, upiVerified: user.upiVerified,
                avatar: user.avatar
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('connections', 'name avatar email accountType organizationName');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const allowedFields = [
            'name', 'phone', 'bio', 'location', 'interests', 'socialLinks',
            'organizationName', 'organizationType', 'gstin', 'website',
            'avatar'
        ];
        const update = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

        const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true }).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.setUpiId = async (req, res) => {
    try {
        const { upiId } = req.body;
        if (!upiId || !upiId.trim())
            return res.status(400).json({ success: false, message: 'UPI ID is required.' });

        const upiRegex = /^[\w.-]+@[\w]+$/;
        if (!upiRegex.test(upiId.trim()))
            return res.status(400).json({ success: false, message: 'Invalid UPI ID format. Example: yourname@upi' });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { upiId: upiId.trim(), upiVerified: false, role: 'organizer' },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'UPI ID saved successfully.', user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

        const user = await User.findById(req.user.id).select('+password');
        if (!(await user.matchPassword(currentPassword)))
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
