const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models/Schema');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ims_key_2026';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, message: 'Account disabled or invalid token.' });
    }

    if (user.requirePasswordChange && !req.path.includes('/reset-password')) {
      return res.status(403).json({ 
        success: false, 
        requirePasswordChange: true, 
        message: 'Password reset mandatory before proceeding.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token validation failed.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role unauthorized: Requires one of [${roles.join(', ')}]` 
      });
    }
    next();
  };
};

const logActivity = (action, resource) => {
  return async (req, res, next) => {
    try {
      await AuditLog.create({
        user: req.user ? req.user._id : null,
        action,
        resource,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        details: { body: req.body, params: req.params }
      });
    } catch (err) {
      console.error('Audit Logging Error:', err);
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles, logActivity, JWT_SECRET };
