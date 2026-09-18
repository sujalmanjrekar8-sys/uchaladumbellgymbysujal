const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Protect Middleware
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. You must log in first.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'uchala_dumbell_gym_jwt_secret_sujal_2026'
    );

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or inactive.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
};

// 2. Owner-only guard
const ownerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access forbidden: Owner authorization required.'
    });
  }
};

// 3. Trainer guard
const trainerOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'trainer' || req.user.role === 'owner')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access forbidden: Trainer authorization required.'
    });
  }
};

// 4. Member-only guard
const memberOnly = (req, res, next) => {
  if (req.user && req.user.role === 'member') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access forbidden: Member authorization required.'
    });
  }
};

module.exports = {
  protect,
  ownerOnly,
  trainerOnly,
  memberOnly
};