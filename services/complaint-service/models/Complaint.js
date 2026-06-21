const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'Roads & Infrastructure',
      'Water Supply',
      'Electricity',
      'Sanitation & Waste',
      'Parks & Recreation',
      'Public Safety',
      'Noise Pollution',
      'Other'
    ),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  trackingId: {
    type: DataTypes.STRING(10),
    unique: true,
  },
  adminNote: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'complaints',
  timestamps: true,
});

// Associations
Complaint.belongsTo(User, { foreignKey: 'userId', as: 'citizen' });
User.hasMany(Complaint,  { foreignKey: 'userId', as: 'complaints' });

module.exports = Complaint;
