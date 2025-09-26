const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Admin Authentication
router.post('/login', async (req, res) => {
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
});

// Get all bookings (admin only)
router.get('/bookings', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM bookings 
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking statistics (admin only)
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalBookingsResult = await pool.query(
      'SELECT COUNT(*) as count FROM bookings WHERE status != $1',
      ['cancelled']
    );
    
    const todaysBookingsResult = await pool.query(
      'SELECT COUNT(*) as count FROM bookings WHERE date = $1 AND status != $2',
      [today, 'cancelled']
    );
    
    const todaysRevenueResult = await pool.query(
      'SELECT COALESCE(SUM(price), 0) as revenue FROM bookings WHERE date = $1 AND status != $2',
      [today, 'cancelled']
    );
    
    res.json({
      totalBookings: parseInt(totalBookingsResult.rows[0].count),
      todaysBookings: parseInt(todaysBookingsResult.rows[0].count),
      todaysRevenue: parseFloat(todaysRevenueResult.rows[0].revenue),
      activeCourts: 3
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Cancel booking (admin only)
router.put('/bookings/:id/cancel', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ success: true, booking: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Clear demo data (admin only)
router.delete('/bookings/demo', authenticateAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings');
    res.json({ success: true, message: 'Demo data cleared' });
  } catch (error) {
    console.error('Error clearing demo data:', error);
    res.status(500).json({ error: 'Failed to clear demo data' });
  }
});

// Generate sample bookings (development helper)
router.post('/generate-sample-data', authenticateAdmin, async (req, res) => {
  try {
    const sampleBookings = [];
    const today = new Date();
    
    // Generate some sample bookings for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Randomly generate some bookings
      if (Math.random() > 0.7) {
        const courtId = Math.floor(Math.random() * 3) + 1;
        const timeSlots = [
          '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
          '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
          '20:00', '21:00'
        ];
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const duration = [60, 90, 120][Math.floor(Math.random() * 3)];
        const pricing = {
          60: [25, 35], 90: [35, 50], 120: [45, 65]
        };
        const price = pricing[duration][Math.floor(Math.random() * 2)];
        
        sampleBookings.push([
          courtId,
          date.toISOString().split('T')[0],
          timeSlot,
          duration,
          `Sample Player ${i + 1}`,
          `player${i + 1}@example.com`,
          `555-010${i.toString().padStart(2, '0')}`,
          ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
          Math.floor(Math.random() * 3),
          Math.random() > 0.8 ? 'Special requests here' : null,
          price,
          'confirmed'
        ]);
      }
    }
    
    // Insert sample bookings
    for (const booking of sampleBookings) {
      await pool.query(`
        INSERT INTO bookings (
          court_id, date, time, duration, player_name, player_email,
          player_phone, player_level, additional_players, special_requests,
          price, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, booking);
    }
    
    res.json({ success: true, message: `Generated ${sampleBookings.length} sample bookings` });
  } catch (error) {
    console.error('Error generating sample data:', error);
    res.status(500).json({ error: 'Failed to generate sample data' });
  }
});

module.exports = router;