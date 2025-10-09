const { Pool } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  const dbName = process.env.DB_NAME || 'padel_booking';
  
  // Connect to postgres database to drop and recreate
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
    console.log(`🗑️  Dropping database: ${dbName}`);
    
    // Terminate existing connections
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
        AND pid <> pg_backend_pid();
    `);
    
    // Drop database
    await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`✅ Database ${dbName} dropped`);
    
    // Create database
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database ${dbName} created`);
    
    await adminPool.end();
    
    console.log('\n✅ Database reset complete!');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run db:migrate');
    console.log('   2. Run: npm run db:seed (optional - for sample data)');
    console.log('   3. Run: npm start');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    await adminPool.end();
    throw error;
  }
}

// Run reset
if (require.main === module) {
  console.log('\n⚠️  DATABASE RESET WARNING ⚠️');
  console.log('This will permanently delete all data in the database.');
  console.log('Press Ctrl+C within 3 seconds to cancel...\n');
  
  setTimeout(() => {
    resetDatabase().catch(error => {
      console.error('❌ Reset failed:', error);
      process.exit(1);
    });
  }, 3000);
}

module.exports = { resetDatabase };
