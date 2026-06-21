const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  deleteNotification,
  createNotification
} = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Citizen routes
router.get('/', protect, getUserNotifications);
router.patch('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

// Admin routes
router.post('/', protect, adminOnly, createNotification);

module.exports = router;
