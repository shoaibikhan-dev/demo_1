const express = require('express');
const router  = express.Router();
const { register, login, getMe, logout, refresh } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { body }    = require('express-validator');

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('cnic').trim().matches(/^\d{5}-\d{7}-\d$/).withMessage('CNIC must be in format XXXXX-XXXXXXX-X'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// @route  POST /api/auth/register
router.post('/register', registerRules, register);



// @route  POST /api/auth/login
router.post('/login', loginRules, login);

// @route  GET  /api/auth/me
router.get('/me', protect, getMe);

// @route  POST /api/auth/logout
router.post('/logout', protect, logout);
// @route  POST /api/auth/refresh
router.post('/refresh', refresh);

module.exports = router;
