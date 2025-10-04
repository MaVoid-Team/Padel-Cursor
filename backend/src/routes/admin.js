const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Admin Authentication
router.post('/login', adminController.login);

// Update booking (admin only)
router.put('/bookings/:id', authenticateAdmin, adminController.updateBooking);

// Delete booking (admin only)
router.delete('/bookings/:id', authenticateAdmin, adminController.deleteBooking);

// Get all bookings (admin only)
router.get('/bookings', authenticateAdmin, adminController.getAllBookings);

// Get booking statistics (admin only)
router.get('/stats', authenticateAdmin, adminController.getStatistics);


module.exports = router;