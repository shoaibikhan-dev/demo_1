const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// @desc  Protect routes - verify JWT
exports.protect = async (req, res, next) => {
  let token;
  // httpOnly cookie first, fallback to Bearer header
  if (req.cookies?.msc_token) {
    token = req.cookies.msc_token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token)
    return res.status(401).json({ success: false, message: 'Not authorized – token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { redisClient } = require('../config/redis');
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) return res.status(401).json({ success: false, message: 'Token has been revoked' });
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });
    if (!req.user)
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// @desc  Restrict to admin role
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

// @desc  Restrict to specific roles
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ success: false, message: 'Permission denied' });
  next();
};
