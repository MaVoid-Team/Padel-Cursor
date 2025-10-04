'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      paymob_transaction_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EGP'
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Store payment gateway response data'
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      refund_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('payments', ['booking_id'], {
      name: 'idx_payments_booking_id'
    });

    await queryInterface.addIndex('payments', ['status'], {
      name: 'idx_payments_status'
    });

    await queryInterface.addIndex('payments', ['payment_method'], {
      name: 'idx_payments_method'
    });

    await queryInterface.addIndex('payments', ['paymob_transaction_id'], {
      name: 'idx_payments_paymob_transaction_id'
    });

    await queryInterface.addIndex('payments', ['created_at'], {
      name: 'idx_payments_created_at'
    });

    // Add check constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT check_payment_method 
      CHECK (payment_method IN ('paymob', 'cash', 'card', 'bank_transfer'))
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT check_payment_status 
      CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'))
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT check_payment_amount 
      CHECK (amount >= 0)
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT check_refund_amount 
      CHECK (refund_amount IS NULL OR refund_amount >= 0)
    `);

    console.log('✅ Payments table created with indexes and constraints');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
