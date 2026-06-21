const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.destroy();
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;
    
    // Validate target user exists
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'system',
      userId
    });

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
