const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized, account no longer exists' });
            if (req.user.isActive === false)
                return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
            next();
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });
};

const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role))
        return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized` });
    next();
};

const optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (err) { req.user = null; }
    }
    next();
};

module.exports = { protect, authorize, optionalAuth };
