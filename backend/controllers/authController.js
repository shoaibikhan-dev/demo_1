const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');
const User = require('../models/User');

// Helper: generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mardan_secret_key', {
    expiresIn: '7d', // Hardcoded to 7d to prevent environment variable typos from crashing the server
  });
};

// @desc    Register new citizen
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, cnic, phone } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists)
      return res.status(409).json({ success: false, message: 'Email already registered' });
      
    const cnicExists = await User.findOne({ where: { cnic } });
    if (cnicExists)
      return res.status(409).json({ success: false, message: 'CNIC already registered' });

    const hashed = await bcrypt.hash(password, 12);
    
    const user = await User.create({ 
      name, 
      email, 
      password: hashed, 
      cnic, 
      phone,
    });

    const token = generateToken(user.id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error({ err: error, email }, 'Register failed');
    res.status(500).json({ success: false, message: 'Registration failed. Please try again later.' });
  }
};



// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user.id);
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error({ err, email }, 'Login failed');
    res.status(500).json({ success: false, message: 'Login failed. Please try again later.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Logout (client-side token deletion)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
