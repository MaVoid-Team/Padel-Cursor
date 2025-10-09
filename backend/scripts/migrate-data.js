const { sequelize } = require('../src/models');
require('dotenv').config();

/**
 * Migration script to update existing bookings data
 * This script should be run after the schema migrations
 */
async function migrateExistingData() {
  try {
    console.log('🔧 Starting data migration...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Update existing bookings to ensure they have valid status
    const [results] = await sequelize.query(`
      UPDATE bookings 
      SET status = 'confirmed' 
      WHERE status NOT IN ('pending', 'confirmed', 'cancelled', 'completed')
    `);
    console.log(`✅ Updated ${results.rowCount || 0} bookings with invalid status`);

    // Ensure all bookings have payment_status
    const [paymentResults] = await sequelize.query(`
      UPDATE bookings 
      SET payment_status = 'pending' 
      WHERE payment_status IS NULL
    `);
    console.log(`✅ Updated ${paymentResults.rowCount || 0} bookings with missing payment status`);

    // Verify all bookings have valid court_id references
    const [invalidCourts] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM bookings b 
      LEFT JOIN courts c ON b.court_id = c.id 
      WHERE c.id IS NULL
    `);
    
    if (invalidCourts[0].count > 0) {
      console.log(`⚠️  Found ${invalidCourts[0].count} bookings with invalid court references`);
      console.log('   These may need manual review');
    } else {
      console.log('✅ All bookings have valid court references');
    }

    console.log('✅ Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Data migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExistingData().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateExistingData };
