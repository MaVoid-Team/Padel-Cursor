const { Pool } = require('pg');
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const dbName = process.env.DB_NAME || 'padel_booking';
  
  // First, connect to the default postgres database to create our database if needed
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
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
    console.log('🔧 Running database migrations...');
    
    // Run migrations using Sequelize CLI
    const env = process.env.NODE_ENV || 'development';
    execSync(`npx sequelize-cli db:migrate --env ${env}`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    
    console.log('✅ Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    throw error;
  }
}

// Run the migrations
if (require.main === module) {
  runMigrations().catch(error => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runMigrations };
