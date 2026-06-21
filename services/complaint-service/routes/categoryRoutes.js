const express = require('express');
const router  = express.Router();

// @route  GET /api/categories
router.get('/', (_req, res) => {
  const categories = [
    'Roads & Infrastructure',
    'Water Supply',
    'Electricity',
    'Sanitation & Waste',
    'Parks & Recreation',
    'Public Safety',
    'Noise Pollution',
    'Other',
  ];
  res.json({ success: true, data: categories });
});

module.exports = router;
