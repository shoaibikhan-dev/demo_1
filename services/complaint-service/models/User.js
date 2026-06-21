const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cnic: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING(10),
    defaultValue: 'citizen',
    validate: {
      isIn: [['citizen', 'admin', 'staff']]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },

}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
