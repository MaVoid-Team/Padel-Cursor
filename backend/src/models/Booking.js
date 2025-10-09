const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  court_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[60, 90, 120]]
    }
  },
  player_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  player_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  player_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  player_level: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['Beginner', 'Intermediate', 'Advanced']]
    }
  },
  additional_players: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 3
    }
  },
  special_requests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'confirmed', 'cancelled', 'completed']]
    }
  },
  confirmation_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Admin user ID who confirmed the booking'
  },
  payment_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'paid', 'failed', 'refunded']]
    }
  },
  is_member: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether the player is a club member (affects pricing)'
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  indexes: [
    {
      fields: ['date']
    },
    {
      fields: ['court_id', 'date']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['court_id', 'date', 'time', 'status'],
      name: 'unique_active_booking',
      where: {
        status: 'confirmed'
      }
    }
  ]
});

module.exports = Booking;