const { Booking, Court } = require('../models');
const { Op } = require('sequelize');

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDateFormat = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
};

/**
 * Validate time format (HH:MM)
 */
const validateTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Convert time string to minutes from midnight
 */
const timeToMinutes = (time) => {
  const [hour, min] = time.split(':').map(Number);
  return hour * 60 + min;
};

/**
 * Convert minutes to time string (HH:MM)
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Validate if booking time falls within court's operating hours
 */
const validateOperatingHours = (court, date, time, duration) => {
  // If no operating hours defined, allow booking (default behavior)
  if (!court.operating_hours) {
    return { valid: true };
  }

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const bookingDate = new Date(date + 'T00:00:00');
  const dayOfWeek = bookingDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  // Get operating hours for this day
  const daySchedule = court.operating_hours[dayName];
  
  if (!daySchedule) {
    return { valid: true }; // If day not defined, allow booking
  }

  // Check if court is closed on this day
  if (daySchedule.closed === true) {
    return { 
      valid: false, 
      reason: `Court ${court.name} is closed on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}s` 
    };
  }

  // If no slots defined, allow booking
  if (!daySchedule.slots || daySchedule.slots.length === 0) {
    return { valid: true };
  }

  // Convert booking time to minutes
  const bookingStartMinutes = timeToMinutes(time);
  const bookingEndMinutes = bookingStartMinutes + parseInt(duration);

  // Check if booking falls within any operating slot
  let withinOperatingHours = false;
  
  for (const slot of daySchedule.slots) {
    const [slotStart, slotEnd] = slot.split('-');
    const slotStartMinutes = timeToMinutes(slotStart);
    const slotEndMinutes = timeToMinutes(slotEnd);

    // Check if booking is completely within this slot
    if (bookingStartMinutes >= slotStartMinutes && bookingEndMinutes <= slotEndMinutes) {
      withinOperatingHours = true;
      break;
    }
  }

  if (!withinOperatingHours) {
    const slotsDisplay = daySchedule.slots.join(', ');
    return { 
      valid: false, 
      reason: `Court ${court.name} operating hours on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}s: ${slotsDisplay}. Your booking (${time} - ${minutesToTime(bookingEndMinutes)}) falls outside these hours.` 
    };
  }

  return { valid: true };
};

/**
 * Check for booking conflicts considering duration overlap
 */
const checkBookingConflicts = async (courtId, date, time, duration, excludeBookingId = null) => {
  const newStartMinutes = timeToMinutes(time);
  const newEndMinutes = newStartMinutes + parseInt(duration);

  // Build query conditions
  const whereConditions = {
    court_id: courtId,
    date: date,
    status: { [Op.in]: ['confirmed', 'pending'] }
  };

  // Exclude specific booking if provided (for updates)
  if (excludeBookingId) {
    whereConditions.id = { [Op.ne]: excludeBookingId };
  }

  // Find all bookings on the same court and date
  const existingBookings = await Booking.findAll({ where: whereConditions });

  // Check for time overlap with any existing booking
  for (const booking of existingBookings) {
    const existingStartMinutes = timeToMinutes(booking.time);
    const existingEndMinutes = existingStartMinutes + parseInt(booking.duration);

    // Check if there's an overlap: (newStart < existingEnd) AND (newEnd > existingStart)
    if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
      return {
        hasConflict: true,
        conflict: {
          booking_id: booking.id,
          existing_time: booking.time,
          existing_duration: booking.duration,
          existing_end: minutesToTime(existingEndMinutes)
        }
      };
    }
  }

  return { hasConflict: false };
};

/**
 * Get bookings for a specific date (public)
 */
exports.getBookingsByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const bookings = await Booking.findAll({
      where: {
        date: date,
        status: 'confirmed'
      },
      attributes: ['court_id', 'time', 'duration']
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings for date:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

/**
 * Create new booking (public)
 */
exports.createBooking = async (req, res) => {
  try {
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
      is_member
    } = req.body;

    // Validate required fields
    if (!court_id || !date || !time || !duration || !player_name || !player_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate date format
    if (!validateDateFormat(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate time format
    if (!validateTimeFormat(time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM (e.g., 14:30)' });
    }

    // Verify court exists and is active
    const court = await Court.findByPk(court_id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    if (!court.is_active) {
      return res.status(400).json({ error: 'Court is not currently available' });
    }

    // Validate operating hours
    const operatingHoursCheck = validateOperatingHours(court, date, time, duration);
    if (!operatingHoursCheck.valid) {
      return res.status(400).json({ 
        error: 'Booking time outside operating hours',
        message: operatingHoursCheck.reason 
      });
    }

    // Calculate price if not provided
    let bookingPrice = price;
    if (!bookingPrice) {
      const hourlyRate = is_member ? court.hourly_price_member : court.hourly_price_non_member;
      const hours = duration / 60;
      bookingPrice = (hourlyRate * hours).toFixed(2);
    }

    // Check for booking conflicts
    const conflictCheck = await checkBookingConflicts(court_id, date, time, duration);
    if (conflictCheck.hasConflict) {
      return res.status(409).json({
        error: 'Time slot conflicts with existing booking',
        conflict: conflictCheck.conflict
      });
    }

    // Create booking with pending status (requires payment confirmation)
    const booking = await Booking.create({
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
      price: bookingPrice,
      status: 'pending',
      payment_status: 'pending'
    });

    res.status(201).json({ 
      success: true, 
      booking: booking,
      court: {
        id: court.id,
        name: court.name
      },
      message: 'Booking created. Please complete payment to confirm.'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => e.message)
      });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Invalid court ID' });
    }
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Export helper functions for reuse
exports.validateDateFormat = validateDateFormat;
exports.validateTimeFormat = validateTimeFormat;
exports.checkBookingConflicts = checkBookingConflicts;
exports.validateOperatingHours = validateOperatingHours;
exports.timeToMinutes = timeToMinutes;
exports.minutesToTime = minutesToTime;
