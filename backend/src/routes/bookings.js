const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Get bookings for a specific date (public)
router.get('/:date', bookingController.getBookingsByDate);

// Create new booking (public)
router.post('/', bookingController.createBooking);

module.exports = router;