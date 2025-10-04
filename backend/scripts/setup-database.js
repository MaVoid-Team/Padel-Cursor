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


// Run the setup
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { setupDatabase };