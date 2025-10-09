'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns to bookings table
    await queryInterface.addColumn('bookings', 'confirmation_date', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('bookings', 'confirmed_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Admin user ID who confirmed the booking'
    });

    await queryInterface.addColumn('bookings', 'payment_status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    });

    // Note: No need to drop court_id constraint as it was never added
    // The initial migration was updated to support dynamic courts from the start

    // Update status check constraint to include 'pending'
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      DROP CONSTRAINT IF EXISTS check_status
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT check_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
    `);

    // Add check constraint for payment_status
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT check_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
    `);

    // Add foreign key constraint to courts table
    await queryInterface.addConstraint('bookings', {
      fields: ['court_id'],
      type: 'foreign key',
      name: 'fk_bookings_court',
      references: {
        table: 'courts',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Update existing bookings to have 'pending' payment status
    await queryInterface.sequelize.query(`
      UPDATE bookings SET payment_status = 'pending' WHERE payment_status IS NULL
    `);

    // Update the default status for new bookings
    await queryInterface.changeColumn('bookings', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    });

    console.log('✅ Bookings table updated with confirmation and payment fields');
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('bookings', 'fk_bookings_court');

    // Remove check constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      DROP CONSTRAINT IF EXISTS check_payment_status
    `);

    // Restore old status constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      DROP CONSTRAINT IF EXISTS check_status
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT check_status CHECK (status IN ('confirmed', 'cancelled', 'completed'))
    `);

    // Note: No need to restore court_id constraint as it supports dynamic courts

    // Remove new columns
    await queryInterface.removeColumn('bookings', 'payment_status');
    await queryInterface.removeColumn('bookings', 'confirmed_by');
    await queryInterface.removeColumn('bookings', 'confirmation_date');

    // Restore default status
    await queryInterface.changeColumn('bookings', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'confirmed'
    });
  }
};
