const { Payment, Booking } = require('../models');
const paymobService = require('../services/paymobService');
const { Op } = require('sequelize');

/**
 * Get all payments (admin only)
 */
exports.getAllPayments = async (req, res) => {
  try {
    const { status, payment_method, date_from, date_to } = req.query;

    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (payment_method) {
      whereClause.payment_method = payment_method;
    }

    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) {
        whereClause.created_at[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        whereClause.created_at[Op.lte] = endDate;
      }
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['id', 'court_id', 'date', 'time', 'player_name', 'player_email']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

/**
 * Get payment by ID
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['id', 'court_id', 'date', 'time', 'duration', 'player_name', 'player_email', 'price']
      }]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

/**
 * Get payment by booking ID
 */
exports.getPaymentByBookingId = async (req, res) => {
  try {
    const { booking_id } = req.params;

    const payment = await Payment.findOne({
      where: { booking_id },
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['id', 'court_id', 'date', 'time', 'duration', 'player_name', 'player_email', 'price']
      }]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found for this booking' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

/**
 * Initiate Paymob payment
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { booking_id, billing_data } = req.body;

    // Validate required fields
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    if (!billing_data || !billing_data.email || !billing_data.first_name || !billing_data.phone_number) {
      return res.status(400).json({ 
        error: 'Billing data required: email, first_name, phone_number' 
      });
    }

    // Check if Paymob is configured
    if (!paymobService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Payment service not configured. Please contact support.' 
      });
    }

    // Find booking
    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ where: { booking_id } });
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(409).json({ 
        error: 'Payment already completed for this booking',
        payment: existingPayment
      });
    }

    // Initiate Paymob payment
    const paymentResult = await paymobService.initiatePayment(booking, billing_data);

    // Create or update payment record
    const paymentData = {
      booking_id,
      payment_method: 'paymob',
      amount: booking.price,
      currency: 'EGP',
      status: 'pending',
      payment_data: {
        order_id: paymentResult.order_id,
        amount_cents: paymentResult.amount_cents,
        billing_data
      }
    };

    let payment;
    if (existingPayment) {
      await existingPayment.update(paymentData);
      payment = existingPayment;
    } else {
      payment = await Payment.create(paymentData);
    }

    // Update booking payment status
    booking.payment_status = 'pending';
    await booking.save();

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      payment_url: paymentResult.iframe_url,
      payment_id: payment.id
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ 
      error: 'Failed to initiate payment',
      details: error.message
    });
  }
};

/**
 * Handle Paymob callback/webhook
 */
exports.handlePaymobCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    // Verify callback
    const verification = await paymobService.verifyCallback(callbackData);

    if (!verification.valid) {
      console.error('Invalid Paymob callback:', verification.reason);
      return res.status(400).json({ error: 'Invalid callback' });
    }

    const bookingId = verification.merchant_order_id;
    const transactionId = verification.transaction_id;

    // Find payment by booking ID
    const payment = await Payment.findOne({ where: { booking_id: bookingId } });

    if (!payment) {
      console.error('Payment not found for booking:', bookingId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    const newStatus = verification.success ? 'completed' : 'failed';
    
    await payment.update({
      status: newStatus,
      paymob_transaction_id: transactionId,
      payment_data: {
        ...payment.payment_data,
        transaction: verification
      }
    });

    // Update booking
    const booking = await Booking.findByPk(bookingId);
    if (booking) {
      booking.payment_status = verification.success ? 'paid' : 'failed';
      if (verification.success) {
        booking.status = 'confirmed';
      }
      await booking.save();
    }

    res.json({ success: true, message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Error handling Paymob callback:', error);
    res.status(500).json({ error: 'Failed to process callback' });
  }
};

/**
 * Create manual payment (cash/card on-site) - Admin only
 */
exports.createManualPayment = async (req, res) => {
  try {
    const { booking_id, payment_method, amount, notes } = req.body;

    // Validate required fields
    if (!booking_id || !payment_method || !amount) {
      return res.status(400).json({ 
        error: 'Required fields: booking_id, payment_method, amount' 
      });
    }

    // Validate payment method
    if (!['cash', 'card', 'bank_transfer'].includes(payment_method)) {
      return res.status(400).json({ 
        error: 'Invalid payment method. Use: cash, card, or bank_transfer' 
      });
    }

    // Find booking
    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ where: { booking_id } });
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(409).json({ 
        error: 'Payment already completed for this booking' 
      });
    }

    // Create payment
    const payment = await Payment.create({
      booking_id,
      payment_method,
      amount,
      currency: 'EGP',
      status: 'completed',
      notes,
      payment_data: {
        manual_payment: true,
        created_by: 'admin',
        timestamp: new Date().toISOString()
      }
    });

    // Update booking
    booking.payment_status = 'paid';
    booking.status = 'confirmed';
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error('Error creating manual payment:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

/**
 * Refund payment (admin only)
 */
exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_amount, notes } = req.body;

    const payment = await Payment.findByPk(id, {
      include: [{
        model: Booking,
        as: 'booking'
      }]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({ error: 'Payment already refunded' });
    }

    const amountToRefund = refund_amount || payment.amount;

    if (parseFloat(amountToRefund) > parseFloat(payment.amount)) {
      return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
    }

    // Update payment
    payment.status = 'refunded';
    payment.refund_amount = amountToRefund;
    payment.refund_date = new Date();
    payment.notes = notes || payment.notes;
    await payment.save();

    // Update booking
    if (payment.booking) {
      payment.booking.payment_status = 'refunded';
      payment.booking.status = 'cancelled';
      await payment.booking.save();
    }

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      payment
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
};

/**
 * Get payment statistics (admin only)
 */
exports.getPaymentStatistics = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    const whereClause = {};
    
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) {
        whereClause.created_at[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        whereClause.created_at[Op.lte] = endDate;
      }
    }

    // Total revenue (completed payments)
    const totalRevenue = await Payment.sum('amount', {
      where: { ...whereClause, status: 'completed' }
    });

    // Total refunded
    const totalRefunded = await Payment.sum('refund_amount', {
      where: { ...whereClause, status: 'refunded' }
    });

    // Payment counts by status
    const paymentsByStatus = await Payment.findAll({
      where: whereClause,
      attributes: [
        'status',
        [Payment.sequelize.fn('COUNT', Payment.sequelize.col('id')), 'count'],
        [Payment.sequelize.fn('SUM', Payment.sequelize.col('amount')), 'total']
      ],
      group: ['status']
    });

    // Payment counts by method
    const paymentsByMethod = await Payment.findAll({
      where: { ...whereClause, status: 'completed' },
      attributes: [
        'payment_method',
        [Payment.sequelize.fn('COUNT', Payment.sequelize.col('id')), 'count'],
        [Payment.sequelize.fn('SUM', Payment.sequelize.col('amount')), 'total']
      ],
      group: ['payment_method']
    });

    res.json({
      success: true,
      statistics: {
        total_revenue: totalRevenue || 0,
        total_refunded: totalRefunded || 0,
        net_revenue: (totalRevenue || 0) - (totalRefunded || 0),
        by_status: paymentsByStatus,
        by_method: paymentsByMethod
      }
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
};
