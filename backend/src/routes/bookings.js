const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get bookings for a specific date (public)
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const result = await pool.query(
      'SELECT court_id, time, duration FROM bookings WHERE date = $1 AND status = $2',
      [date, 'confirmed']
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings for date:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create new booking (public)
router.post('/', async (req, res) => {
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
      price
    } = req.body;
    
    // Validate required fields
    if (!court_id || !date || !time || !duration || !player_name || !player_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if slot is available
    const existingBooking = await pool.query(
      'SELECT id FROM bookings WHERE court_id = $1 AND date = $2 AND time = $3 AND status = $4',
      [court_id, date, time, 'confirmed']
    );
    
    if (existingBooking.rows.length > 0) {
      return res.status(409).json({ error: 'Time slot already booked' });
    }
    
    // Create booking
    const result = await pool.query(`
      INSERT INTO bookings (
        court_id, date, time, duration, player_name, player_email, 
        player_phone, player_level, additional_players, special_requests, 
        price, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      court_id, date, time, duration, player_name, player_email,
      player_phone, player_level, additional_players, special_requests,
      price, 'confirmed'
    ]);
    
    res.status(201).json({ success: true, booking: result.rows[0] });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

module.exports = router;