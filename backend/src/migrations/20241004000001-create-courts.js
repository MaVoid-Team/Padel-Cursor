'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('courts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      hourly_price_member: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      hourly_price_non_member: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      operating_hours: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          monday: { slots: ['06:00-22:00'], closed: false },
          tuesday: { slots: ['06:00-22:00'], closed: false },
          wednesday: { slots: ['06:00-22:00'], closed: false },
          thursday: { slots: ['06:00-22:00'], closed: false },
          friday: { slots: ['06:00-22:00'], closed: false },
          saturday: { slots: ['06:00-22:00'], closed: false },
          sunday: { slots: ['06:00-22:00'], closed: false }
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('courts', ['is_active'], {
      name: 'idx_courts_is_active'
    });

    await queryInterface.addIndex('courts', ['name'], {
      name: 'idx_courts_name',
      unique: true
    });

    // Seed initial courts with current pricing
    await queryInterface.bulkInsert('courts', [
      {
        name: 'Court 1',
        description: 'Premium indoor court with professional lighting',
        is_active: true,
        hourly_price_member: 25.00,
        hourly_price_non_member: 35.00,
        operating_hours: JSON.stringify({
          monday: { slots: ['06:00-22:00'], closed: false },
          tuesday: { slots: ['06:00-22:00'], closed: false },
          wednesday: { slots: ['06:00-22:00'], closed: false },
          thursday: { slots: ['06:00-22:00'], closed: false },
          friday: { slots: ['06:00-22:00'], closed: false },
          saturday: { slots: ['06:00-22:00'], closed: false },
          sunday: { slots: ['06:00-22:00'], closed: false }
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Court 2',
        description: 'Standard court with excellent playing surface',
        is_active: true,
        hourly_price_member: 25.00,
        hourly_price_non_member: 35.00,
        operating_hours: JSON.stringify({
          monday: { slots: ['06:00-22:00'], closed: false },
          tuesday: { slots: ['06:00-22:00'], closed: false },
          wednesday: { slots: ['06:00-22:00'], closed: false },
          thursday: { slots: ['06:00-22:00'], closed: false },
          friday: { slots: ['06:00-22:00'], closed: false },
          saturday: { slots: ['06:00-22:00'], closed: false },
          sunday: { slots: ['06:00-22:00'], closed: false }
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Court 3',
        description: 'Outdoor court with natural lighting',
        is_active: true,
        hourly_price_member: 25.00,
        hourly_price_non_member: 35.00,
        operating_hours: JSON.stringify({
          monday: { slots: ['06:00-22:00'], closed: false },
          tuesday: { slots: ['06:00-22:00'], closed: false },
          wednesday: { slots: ['06:00-22:00'], closed: false },
          thursday: { slots: ['06:00-22:00'], closed: false },
          friday: { slots: ['06:00-22:00'], closed: false },
          saturday: { slots: ['06:00-22:00'], closed: false },
          sunday: { slots: ['06:00-22:00'], closed: false }
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    console.log('✅ Courts table created and seeded with 3 courts');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('courts');
  }
};
