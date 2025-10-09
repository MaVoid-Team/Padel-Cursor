'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      court_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      player_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      player_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      player_phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      player_level: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      additional_players: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      special_requests: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: 'confirmed'
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
    await queryInterface.addIndex('bookings', ['date'], {
      name: 'idx_bookings_date'
    });

    await queryInterface.addIndex('bookings', ['court_id', 'date'], {
      name: 'idx_bookings_court_date'
    });

    await queryInterface.addIndex('bookings', ['status'], {
      name: 'idx_bookings_status'
    });

    // Add unique constraint for active bookings
    await queryInterface.addIndex('bookings', ['court_id', 'date', 'time', 'status'], {
      name: 'unique_active_booking',
      unique: true,
      where: {
        status: 'confirmed'
      }
    });

    // Add check constraints using raw SQL
    // Note: No court_id constraint - courts are dynamically managed
    
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT check_duration CHECK (duration IN (60, 90, 120))
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT check_player_level CHECK (player_level IN ('Beginner', 'Intermediate', 'Advanced'))
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT check_additional_players CHECK (additional_players >= 0 AND additional_players <= 3)
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT check_status CHECK (status IN ('confirmed', 'cancelled', 'completed'))
    `);

    // Create trigger function for updating updated_at
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_bookings_updated_at
        BEFORE UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop trigger
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
    `);

    // Drop trigger function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS update_updated_at_column();
    `);

    // Drop the table (this will also drop all indexes and constraints)
    await queryInterface.dropTable('bookings');
  }
};
