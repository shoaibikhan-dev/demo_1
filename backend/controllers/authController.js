const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');
const User = require('../models/User');

const crypto = require('crypto');

// Helper: generate short-lived access token (15 min)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Helper: generate opaque refresh token
const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

// Helper: set both cookies
const setTokenCookies = async (res, userId) => {
  const accessToken  = generateAccessToken(userId);
  const refreshToken = generateRefreshToken();

  const { redisClient } = require('../config/redis');

  await redisClient.set(
    `refresh:${refreshToken}`,
    String(userId),
    'EX',
    7 * 24 * 60 * 60
  );

  res.cookie('msc_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('msc_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth/refresh',
  });

  return { accessToken, refreshToken };
};

// Register
exports.register = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty())
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });

  const { name, email, password, cnic, phone } = req.body;

  try {
    const exists = await User.findOne({ where: { email } });

    if (exists)
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });

    const cnicExists = await User.findOne({ where: { cnic } });

    if (cnicExists)
      return res.status(409).json({
        success: false,
        message: 'CNIC already registered',
      });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      cnic,
      phone,
    });

    await setTokenCookies(res, user.id);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error({ err: error, email }, 'Register failed');

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.',
    });
  }
};

// Login with account lockout
exports.login = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty())
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });

  const { email, password } = req.body;

  try {
    const { redisClient } = require("../config/redis");
    const userCacheKey = `user:email:${email}`;
    let user;
    const cachedUser = await redisClient.get(userCacheKey);
    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      user = await User.findOne({ where: { email }, attributes: ['id', 'password', 'role', 'isActive', 'failedLoginAttempts', 'lockedUntil', 'name', 'email'] });
      if (user) await redisClient.set(userCacheKey, JSON.stringify(user), "EX", 300);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Account locked?
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked. Try again later.',
      });
    }

    // Redis cache check - avoid bcrypt on repeat logins
    const { redisClient } = require('../config/redis');
    const cacheKey = `login_ok:${user.id}`;
    const cached = await redisClient.get(cacheKey);
    let passwordMatch;
    if (cached === 'ok') {
      passwordMatch = true;
    } else {
      passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        await redisClient.set(cacheKey, 'ok', 'EX', 300);
      }
    }

    if (!passwordMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;

      if (attempts >= 5) {
        await user.update({
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        });

        return res.status(423).json({
          success: false,
          message:
            'Account locked for 15 minutes due to multiple failed login attempts.',
        });
      }

      await user.update({
        failedLoginAttempts: attempts,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await user.update({
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await setTokenCookies(res, user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error({ err, email }, 'Login failed');

    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.',
    });
  }
};

// Current User
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { redisClient } = require('../config/redis');

    const accessToken = req.cookies.msc_token;
    const refreshToken = req.cookies.msc_refresh;

    if (accessToken)
      await redisClient.set(
        `blacklist:${accessToken}`,
        'true',
        'EX',
        15 * 60
      );

    if (refreshToken)
      await redisClient.del(`refresh:${refreshToken}`);

    res.clearCookie('msc_token');
    res.clearCookie('msc_refresh', {
      path: '/api/v1/auth/refresh',
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

// Refresh
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.msc_refresh;

    if (!refreshToken)
      return res.status(401).json({
        success: false,
        message: 'No refresh token',
      });

    const { redisClient } = require('../config/redis');

    const userId = await redisClient.get(
      `refresh:${refreshToken}`
    );

    if (!userId)
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired or revoked',
      });

    await redisClient.del(`refresh:${refreshToken}`);

    await setTokenCookies(res, userId);

    res.json({
      success: true,
      message: 'Token refreshed',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
    });
  }
};
