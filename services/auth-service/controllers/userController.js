const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user
// @route   PATCH /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, phone, role, isActive } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (name     !== undefined) user.name     = name;
    if (phone    !== undefined) user.phone    = phone;
    if (role     !== undefined) user.role     = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    await user.destroy();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
