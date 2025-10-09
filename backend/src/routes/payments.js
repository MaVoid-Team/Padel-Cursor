const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateAdmin } = require('../middleware/auth');

// Public routes
// Initiate Paymob payment
router.post('/initiate', paymentController.initiatePayment);

// Paymob callback/webhook
router.post('/paymob/callback', paymentController.handlePaymobCallback);

// Get payment by booking ID (for users to check their payment status)
router.get('/booking/:booking_id', paymentController.getPaymentByBookingId);

// Admin routes (require authentication)
// Get all payments with optional filters
router.get('/', authenticateAdmin, paymentController.getAllPayments);

// Get payment statistics
router.get('/statistics', authenticateAdmin, paymentController.getPaymentStatistics);

// Get single payment by ID
router.get('/:id', authenticateAdmin, paymentController.getPaymentById);

// Create manual payment (cash/card on-site)
router.post('/manual', authenticateAdmin, paymentController.createManualPayment);

// Refund payment
router.post('/:id/refund', authenticateAdmin, paymentController.refundPayment);

module.exports = router;
