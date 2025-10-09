const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Court = sequelize.define('Court', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  hourly_price_member: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  hourly_price_non_member: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  operating_hours: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      monday: { slots: ['06:00-22:00'], closed: false },
      tuesday: { slots: ['06:00-22:00'], closed: false },
      wednesday: { slots: ['06:00-22:00'], closed: false },
      thursday: { slots: ['06:00-22:00'], closed: false },
      friday: { slots: ['06:00-22:00'], closed: false },
      saturday: { slots: ['06:00-22:00'], closed: false },
      sunday: { slots: ['06:00-22:00'], closed: false }
    }
  }
}, {
  tableName: 'courts',
  timestamps: true,
  indexes: [
    {
      fields: ['is_active']
    },
    {
      unique: true,
      fields: ['name']
    }
  ]
});

module.exports = Court;
