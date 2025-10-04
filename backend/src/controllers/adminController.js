const jwt = require('jsonwebtoken');
const { Booking, Court } = require('../models');
const { Op } = require('sequelize');
const {
  validateDateFormat,
  validateTimeFormat,
  checkBookingConflicts,
  validateOperatingHours
} = require('./bookingController');

/**
 * Admin login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Simple admin authentication (in production, use proper user management)
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { username: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
      );

      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all bookings (admin only)
 */
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

/**
 * Get comprehensive statistics and analytics (admin only)
 */
exports.getStatistics = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // ===== OVERALL STATISTICS =====
    const totalBookings = await Booking.count({
      where: {
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    const totalRevenue = await Booking.sum('price', {
      where: {
        status: {
          [Op.in]: ['confirmed', 'completed']
        },
        payment_status: 'paid'
      }
    });

    const totalHoursBooked = await Booking.sum('duration', {
      where: {
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    // ===== TODAY'S STATISTICS =====
    const todaysBookings = await Booking.count({
      where: {
        date: today,
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    const todaysRevenue = await Booking.sum('price', {
      where: {
        date: today,
        status: {
          [Op.in]: ['confirmed', 'completed']
        },
        payment_status: 'paid'
      }
    });

    const todaysHours = await Booking.sum('duration', {
      where: {
        date: today,
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    // ===== THIS WEEK'S STATISTICS =====
    const weekBookings = await Booking.count({
      where: {
        date: {
          [Op.gte]: startOfWeekStr
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    const weekRevenue = await Booking.sum('price', {
      where: {
        date: {
          [Op.gte]: startOfWeekStr
        },
        status: {
          [Op.in]: ['confirmed', 'completed']
        },
        payment_status: 'paid'
      }
    });

    // ===== THIS MONTH'S STATISTICS =====
    const monthBookings = await Booking.count({
      where: {
        date: {
          [Op.gte]: startOfMonthStr
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    const monthRevenue = await Booking.sum('price', {
      where: {
        date: {
          [Op.gte]: startOfMonthStr
        },
        status: {
          [Op.in]: ['confirmed', 'completed']
        },
        payment_status: 'paid'
      }
    });

    const monthHours = await Booking.sum('duration', {
      where: {
        date: {
          [Op.gte]: startOfMonthStr
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    // ===== PENDING PAYMENTS =====
    const pendingPayments = await Booking.count({
      where: {
        payment_status: 'pending',
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    const pendingPaymentsValue = await Booking.sum('price', {
      where: {
        payment_status: 'pending',
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    // ===== BOOKING STATUS BREAKDOWN =====
    const statusBreakdown = await Booking.findAll({
      attributes: [
        'status',
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'count'],
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('price')), 'revenue']
      ],
      group: ['status'],
      raw: true
    });

    // ===== PAYMENT STATUS BREAKDOWN =====
    const paymentStatusBreakdown = await Booking.findAll({
      attributes: [
        'payment_status',
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'count'],
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('price')), 'value']
      ],
      group: ['payment_status'],
      raw: true
    });

    // ===== COURT UTILIZATION =====
    const courtUtilization = await Booking.findAll({
      attributes: [
        'court_id',
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'bookings'],
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('duration')), 'total_hours'],
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('price')), 'revenue']
      ],
      where: {
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: ['court_id'],
      raw: true
    });

    // ===== MEMBERSHIP ANALYSIS =====
    const memberBookings = await Booking.count({
      where: {
        is_member: true,
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    const nonMemberBookings = await Booking.count({
      where: {
        is_member: false,
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    const memberRevenue = await Booking.sum('price', {
      where: {
        is_member: true,
        status: {
          [Op.in]: ['confirmed', 'completed']
        },
        payment_status: 'paid'
      }
    });

    const nonMemberRevenue = await Booking.sum('price', {
      where: {
        is_member: false,
        status: {
          [Op.in]: ['confirmed', 'completed']
        },
        payment_status: 'paid'
      }
    });

    // ===== PEAK HOURS ANALYSIS =====
    const peakHours = await Booking.findAll({
      attributes: [
        [Booking.sequelize.fn('EXTRACT', Booking.sequelize.literal('HOUR FROM time')), 'hour'],
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'bookings']
      ],
      where: {
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: [Booking.sequelize.fn('EXTRACT', Booking.sequelize.literal('HOUR FROM time'))],
      order: [[Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    // ===== CANCELLATION RATE =====
    const totalBookingsIncludingCancelled = await Booking.count();
    const cancelledBookings = await Booking.count({
      where: { status: 'cancelled' }
    });
    const cancellationRate = totalBookingsIncludingCancelled > 0 
      ? ((cancelledBookings / totalBookingsIncludingCancelled) * 100).toFixed(2)
      : 0;

    // ===== UPCOMING BOOKINGS =====
    const upcomingBookings = await Booking.count({
      where: {
        date: {
          [Op.gte]: today
        },
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      }
    });

    // ===== AVERAGE BOOKING VALUE =====
    const averageBookingValue = totalBookings > 0 
      ? (parseFloat(totalRevenue || 0) / totalBookings).toFixed(2)
      : 0;

    // Get active courts count
    const activeCourts = await Court.count({
      where: { is_active: true }
    });

    res.json({
      // Overall metrics
      overview: {
        totalBookings: totalBookings || 0,
        totalRevenue: parseFloat(totalRevenue || 0).toFixed(2),
        totalHoursBooked: Math.round((totalHoursBooked || 0) / 60 * 10) / 10, // Convert to hours
        activeCourts: activeCourts || 0,
        averageBookingValue: averageBookingValue,
        cancellationRate: cancellationRate
      },

      // Today's metrics
      today: {
        bookings: todaysBookings || 0,
        revenue: parseFloat(todaysRevenue || 0).toFixed(2),
        hoursBooked: Math.round((todaysHours || 0) / 60 * 10) / 10
      },

      // This week's metrics
      thisWeek: {
        bookings: weekBookings || 0,
        revenue: parseFloat(weekRevenue || 0).toFixed(2)
      },

      // This month's metrics
      thisMonth: {
        bookings: monthBookings || 0,
        revenue: parseFloat(monthRevenue || 0).toFixed(2),
        hoursBooked: Math.round((monthHours || 0) / 60 * 10) / 10
      },

      // Pending payments
      pendingPayments: {
        count: pendingPayments || 0,
        value: parseFloat(pendingPaymentsValue || 0).toFixed(2)
      },

      // Upcoming bookings
      upcomingBookings: upcomingBookings || 0,

      // Status breakdown
      statusBreakdown: statusBreakdown.map(item => ({
        status: item.status,
        count: parseInt(item.count),
        revenue: parseFloat(item.revenue || 0).toFixed(2)
      })),

      // Payment status breakdown
      paymentStatusBreakdown: paymentStatusBreakdown.map(item => ({
        status: item.payment_status,
        count: parseInt(item.count),
        value: parseFloat(item.value || 0).toFixed(2)
      })),

      // Court utilization
      courtUtilization: courtUtilization.map(item => ({
        courtId: item.court_id,
        bookings: parseInt(item.bookings),
        hoursBooked: Math.round((item.total_hours || 0) / 60 * 10) / 10,
        revenue: parseFloat(item.revenue || 0).toFixed(2)
      })),

      // Membership analysis
      membership: {
        members: {
          bookings: memberBookings || 0,
          revenue: parseFloat(memberRevenue || 0).toFixed(2),
          percentage: totalBookings > 0 ? ((memberBookings / totalBookings) * 100).toFixed(1) : 0
        },
        nonMembers: {
          bookings: nonMemberBookings || 0,
          revenue: parseFloat(nonMemberRevenue || 0).toFixed(2),
          percentage: totalBookings > 0 ? ((nonMemberBookings / totalBookings) * 100).toFixed(1) : 0
        }
      },

      // Peak hours
      peakHours: peakHours.map(item => ({
        hour: parseInt(item.hour),
        bookings: parseInt(item.bookings),
        timeSlot: `${item.hour}:00 - ${parseInt(item.hour) + 1}:00`
      }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * Update booking (admin only)
 */
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      court_id,
      date,
      time,
      duration,
      player_name,
      player_email,
      player_phone,
      player_level,
      additional_players,
      special_requests,
      price,
      status
    } = req.body;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Validate date format if provided
    if (date && !validateDateFormat(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate time format if provided
    if (time && !validateTimeFormat(time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM (e.g., 14:30)' });
    }

    // Check for conflicts if time/date/court/duration is being changed
    if (court_id || date || time || duration) {
      const newCourtId = court_id || booking.court_id;
      const newDate = date || booking.date;
      const newTime = time || booking.time;
      const newDuration = duration || booking.duration;

      // Validate court and operating hours if court is being changed
      if (court_id || date || time || duration) {
        const court = await Court.findByPk(newCourtId);
        if (!court) {
          return res.status(404).json({ error: 'Court not found' });
        }

        if (!court.is_active) {
          return res.status(400).json({ error: 'Court is not currently available' });
        }

        // Validate operating hours
        const operatingHoursCheck = validateOperatingHours(court, newDate, newTime, newDuration);
        if (!operatingHoursCheck.valid) {
          return res.status(400).json({ 
            error: 'Booking time outside operating hours',
            message: operatingHoursCheck.reason 
          });
        }
      }

      const conflictCheck = await checkBookingConflicts(
        newCourtId,
        newDate,
        newTime,
        newDuration,
        id // Exclude current booking from conflict check
      );

      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          error: 'Time slot conflicts with existing booking',
          conflict: conflictCheck.conflict
        });
      }
    }

    // Update booking fields
    if (court_id !== undefined) booking.court_id = court_id;
    if (date !== undefined) booking.date = date;
    if (time !== undefined) booking.time = time;
    if (duration !== undefined) booking.duration = duration;
    if (player_name !== undefined) booking.player_name = player_name;
    if (player_email !== undefined) booking.player_email = player_email;
    if (player_phone !== undefined) booking.player_phone = player_phone;
    if (player_level !== undefined) booking.player_level = player_level;
    if (additional_players !== undefined) booking.additional_players = additional_players;
    if (special_requests !== undefined) booking.special_requests = special_requests;
    if (price !== undefined) booking.price = price;
    if (status !== undefined) booking.status = status;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

/**
 * Delete booking (admin only)
 */
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Store booking info before deletion for response
    const bookingInfo = {
      id: booking.id,
      court_id: booking.court_id,
      date: booking.date,
      time: booking.time,
      player_name: booking.player_name
    };

    await booking.destroy();

    res.json({
      success: true,
      message: 'Booking deleted successfully',
      deleted: bookingInfo
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

