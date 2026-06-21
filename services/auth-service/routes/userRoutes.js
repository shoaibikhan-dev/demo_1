const express = require('express');
const router  = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin only
router.get('/',       protect, adminOnly, getAllUsers);
router.get('/:id',    protect, adminOnly, getUserById);
router.patch('/:id',  protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
