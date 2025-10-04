'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add is_member column to bookings table
    await queryInterface.addColumn('bookings', 'is_member', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the player is a club member (affects pricing)'
    });

    // Add index for faster queries
    await queryInterface.addIndex('bookings', ['is_member'], {
      name: 'idx_bookings_is_member'
    });

    console.log('✅ Added is_member column to bookings table');
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('bookings', 'idx_bookings_is_member');
    
    // Remove column
    await queryInterface.removeColumn('bookings', 'is_member');
  }
};
