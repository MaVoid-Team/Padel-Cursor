const { sequelize } = require('../config/database');
const Booking = require('./Booking');
const Court = require('./Court');
const Payment = require('./Payment');

// Initialize models
const models = {
  Booking,
  Court,
  Payment
};

// Set up associations
// Court has many Bookings
Court.hasMany(Booking, {
  foreignKey: 'court_id',
  as: 'bookings',
  onDelete: 'CASCADE'
});

Booking.belongsTo(Court, {
  foreignKey: 'court_id',
  as: 'court'
});

// Booking has one Payment
Booking.hasOne(Payment, {
  foreignKey: 'booking_id',
  as: 'payment',
  onDelete: 'CASCADE'
});

Payment.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking'
});

module.exports = {
  sequelize,
  ...models
};