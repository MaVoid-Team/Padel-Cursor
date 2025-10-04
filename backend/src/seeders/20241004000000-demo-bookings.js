'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
          status: 'confirmed',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('bookings', sampleBookings, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('bookings', {
      player_email: {
        [Sequelize.Op.like]: 'player%@example.com'
      }
    }, {});
  }
};
