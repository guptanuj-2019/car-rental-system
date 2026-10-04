const jwt = require('jsonwebtoken');
// 1. We must import the User model so the middleware can check the database!
const User = require('../models/User'); 

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 2. THIS IS THE FIX: Fetch the complete user document (including their role) using the ID
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Admin' });
  }
};

const staffOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'Rental Staff' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as Staff' });
  }
};

module.exports = { protect, adminOnly, staffOnly };