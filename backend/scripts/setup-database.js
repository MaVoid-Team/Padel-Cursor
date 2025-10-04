const { Pool } = require('pg');
const { sequelize, Booking } = require('../src/models');
require('dotenv').config();

async function setupDatabase() {
  const dbName = process.env.DB_NAME || 'padel_booking';
  
  // First, connect to the default postgres database to create our database if needed
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default database first
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🔧 Setting up database...');
    
    // Create database if it doesn't exist
    try {
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database ${dbName} created successfully`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️  Database ${dbName} already exists`);
      } else {
        console.error('❌ Error creating database:', error.message);
        throw error;
      }
    }
    
    await adminPool.end();
  } catch (error) {
    console.error('❌ Error during database creation:', error.message);
    await adminPool.end();
    throw error;
  }

  try {
    console.log('🔧 Testing database connection...');
    
    // Test connection to Sequelize
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    console.log('🔧 Running database migrations...');
    console.log('ℹ️  To run migrations manually, use: npm run db:migrate');
    console.log('ℹ️  This script will use sync for backward compatibility');
    
    // For now, still use sync but recommend migrations
    // In production, you should use migrations instead
    await sequelize.sync({ alter: false });
    console.log('✅ Database schema verified successfully');
    
    // Check if we should insert sample data
    const bookingCount = await Booking.count();
    
    if (bookingCount === 0) {
      console.log('🔧 Inserting sample data...');
      await insertSampleData();
    } else {
      console.log(`ℹ️  Database already contains ${bookingCount} bookings`);
    }
    
    console.log('✅ Database setup completed successfully!');
    console.log('💡 Tip: Use migrations for production: npm run db:migrate');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    throw error;
  }
}

async function insertSampleData() {
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
      
      sampleBookings.push({
        court_id: courtId,
        date: date.toISOString().split('T')[0],
        time: timeSlot,
        duration: duration,
        player_name: `Sample Player ${i + 1}`,
        player_email: `player${i + 1}@example.com`,
        player_phone: `555-010${i.toString().padStart(2, '0')}`,
        player_level: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
        additional_players: Math.floor(Math.random() * 3),
        special_requests: Math.random() > 0.8 ? 'Special requests here' : null,
        price: price,
        status: 'confirmed'
      });
    }
  }
  
  // Insert sample bookings using Sequelize
  for (const bookingData of sampleBookings) {
    try {
      await Booking.create(bookingData);
    } catch (error) {
      // Skip duplicates and other validation errors
      if (error.name !== 'SequelizeUniqueConstraintError') {
        console.error('Error inserting sample booking:', error.message);
      }
    }
  }
  
  console.log(`✅ Inserted ${sampleBookings.length} sample bookings`);
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { setupDatabase };