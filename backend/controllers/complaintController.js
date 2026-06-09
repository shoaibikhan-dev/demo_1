const Complaint = require('../models/Complaint');
const User      = require('../models/User');
const path      = require('path');
const { redisClient } = require('../config/redis');
const { notificationQueue } = require('../config/queue');
const logger = require('../config/logger');

const generateTrackingId = () =>
  'MSC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

const buildImageUrl = (req, file) =>
  file ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}` : null;

const invalidateComplaintCache = async () => {
  try {
    const keys = await redisClient.keys('complaints:*');
    if (keys.length > 0) await redisClient.del(keys);
  } catch (err) {
    logger.error({ err }, 'Cache invalidation error');
  }
};

exports.createComplaint = async (req, res) => {
  const { title, description, category, priority, location } = req.body;
  if (!title || !description || !category)
    return res.status(400).json({ success: false, message: 'Title, description and category are required.' });
  try {
    const trackingId = generateTrackingId();
    const imageUrl   = buildImageUrl(req, req.file);
    const complaint = await Complaint.create({
      title: title.trim(), description: description.trim(),
      category, priority: priority || 'medium',
      location: location?.trim() || null,
      imageUrl, trackingId, userId: req.user.id,
    });
    await invalidateComplaintCache();
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const cacheKey = `complaints:all:${JSON.stringify(req.query)}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) { logger.info('Cache HIT'); return res.json(JSON.parse(cached)); }
    logger.info('Cache MISS');
    const { status, category, priority, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (status)   where.status   = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (search)   where.title    = { [Op.iLike]: `%${search}%` };
    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [{ model: User, as: 'citizen', attributes: ['id', 'name', 'email', 'phone'] }],
      order: [[sortBy, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    const result = { success: true, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)), data: rows };
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const cacheKey = `complaints:id:${req.params.id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    const complaint = await Complaint.findByPk(req.params.id, {
      include: [{ model: User, as: 'citizen', attributes: ['id', 'name', 'email', 'phone'] }],
    });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (req.user.role === 'citizen' && complaint.userId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied.' });
    const result = { success: true, data: complaint };
    await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, priority, adminNote } = req.body;
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    const validStatuses  = ['pending', 'in_progress', 'resolved', 'rejected'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (status   && validStatuses.includes(status))    complaint.status   = status;
    if (priority && validPriorities.includes(priority)) complaint.priority = priority;
    if (adminNote !== undefined) complaint.adminNote = adminNote;
    if (status === 'resolved' && !complaint.resolvedAt) complaint.resolvedAt = new Date();
    await complaint.save();
    await notificationQueue.add({
      complaintId: complaint.id,
      status: complaint.status,
      userEmail: complaint.userId,
    });
    await invalidateComplaintCache();
    await redisClient.del(`complaints:id:${req.params.id}`);
    res.json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.imageUrl) {
      const fs  = require('fs');
      const pth = require('path');
      const file = pth.join(__dirname, '..', 'uploads', pth.basename(complaint.imageUrl));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    await complaint.destroy();
    await invalidateComplaintCache();
    await redisClient.del(`complaints:id:${req.params.id}`);
    res.json({ success: true, message: 'Complaint deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.trackComplaint = async (req, res) => {
  try {
    const cacheKey = `complaints:track:${req.params.trackingId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    const complaint = await Complaint.findOne({
      where: { trackingId: req.params.trackingId.toUpperCase() },
      attributes: ['id', 'title', 'description', 'category', 'status', 'priority', 'location', 'trackingId', 'imageUrl', 'createdAt', 'resolvedAt'],
    });
    if (!complaint) return res.status(404).json({ success: false, message: 'No complaint found with this tracking ID.' });
    const result = { success: true, data: complaint };
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserComplaints = async (req, res) => {
  try {
    const cacheKey = `complaints:user:${req.user.id}:${JSON.stringify(req.query)}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    const { status, category, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };
    if (status)   where.status   = status;
    if (category) where.category = category;
    const { count, rows } = await Complaint.findAndCountAll({
      where, order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });
    const result = { success: true, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)), data: rows };
    await redisClient.setEx(cacheKey, 120, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId   = req.user?.id || 'public';
    const role     = req.user?.role || 'public';
    const cacheKey = `complaints:stats:${role}:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    const where = req.user && req.user.role === 'citizen' ? { userId: req.user.id } : {};
    const [total, pending, inProgress, resolved, rejected] = await Promise.all([
      Complaint.count({ where }),
      Complaint.count({ where: { ...where, status: 'pending' } }),
      Complaint.count({ where: { ...where, status: 'in_progress' } }),
      Complaint.count({ where: { ...where, status: 'resolved' } }),
      Complaint.count({ where: { ...where, status: 'rejected' } }),
    ]);
    const result = { success: true, data: { total, pending, inProgress, resolved, rejected } };
    await redisClient.setEx(cacheKey, 120, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
