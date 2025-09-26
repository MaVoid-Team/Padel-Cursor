const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default database first
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'padel_booking';
    
    try {
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`Database ${dbName} already exists`);
      } else {
        throw error;
      }
    }
    
    // Connect to the new database
    const dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });
    
    // Create tables
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        court_id INTEGER NOT NULL CHECK (court_id IN (1, 2, 3)),
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration INTEGER NOT NULL CHECK (duration IN (60, 90, 120)),
        player_name VARCHAR(255) NOT NULL,
        player_email VARCHAR(255) NOT NULL,
        player_phone VARCHAR(50),
        player_level VARCHAR(50) CHECK (player_level IN ('Beginner', 'Intermediate', 'Advanced')),
        additional_players INTEGER DEFAULT 0 CHECK (additional_players >= 0 AND additional_players <= 3),
        special_requests TEXT,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(court_id, date, time, status) DEFERRABLE INITIALLY DEFERRED
      )
    `);
    
    // Create indexes for better performance
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
    `);
    
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_court_date ON bookings(court_id, date);
    `);
    
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    `);
    
    // Create a trigger to update the updated_at column
    await dbPool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await dbPool.query(`
      DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
      CREATE TRIGGER update_bookings_updated_at
        BEFORE UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('Database tables created successfully');
    
    // Check if we should insert sample data
    const countResult = await dbPool.query('SELECT COUNT(*) FROM bookings');
    const bookingCount = parseInt(countResult.rows[0].count);
    
    if (bookingCount === 0) {
      console.log('Inserting sample data...');
      await insertSampleData(dbPool);
    } else {
      console.log(`Database already contains ${bookingCount} bookings`);
    }
    
    await dbPool.end();
    await pool.end();
    
    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

async function insertSampleData(dbPool) {
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
    try {
      await dbPool.query(`
        INSERT INTO bookings (
          court_id, date, time, duration, player_name, player_email,
          player_phone, player_level, additional_players, special_requests,
          price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, booking);
    } catch (error) {
      // Skip duplicates
      if (error.code !== '23505') {
        console.error('Error inserting sample booking:', error);
      }
    }
  }
  
  console.log(`Inserted ${sampleBookings.length} sample bookings`);
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };