const express  = require('express');
const router   = express.Router();
const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  trackComplaint,
  getUserComplaints,
  getStats,
} = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload, verifyAndSave } = require('../middleware/uploadMiddleware');

// Public routes
router.get('/track/:trackingId', trackComplaint);
router.get('/public-stats', getStats);

// Citizen routes (protected)
router.post('/',        protect, upload.single('image'), verifyAndSave, createComplaint);
router.get('/my',       protect, getUserComplaints);
router.get('/stats',    protect, getStats);
router.get('/:id',      protect, getComplaintById);

// Admin routes
router.get('/',         protect, adminOnly, getAllComplaints);
router.patch('/:id',    protect, adminOnly, updateComplaintStatus);
router.delete('/:id',   protect, adminOnly, deleteComplaint);

module.exports = router;
