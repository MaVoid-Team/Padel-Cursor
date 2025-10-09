const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./config/database');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const courtRoutes = require('./routes/courts');
const paymentRoutes = require('./routes/payments');
const { setupDatabase } = require('../scripts/setup-database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database on startup
async function initializeDatabase() {
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Initializing database (attempt ${attempt}/${maxRetries})...`);
      await setupDatabase();
      console.log('✅ Database initialization completed');
      return;
    } catch (error) {
      console.error(`❌ Database initialization failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        console.error('⚠️  All database initialization attempts failed. Server will continue but database operations may fail');
        return;
      }
      
      console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Test database connection with Sequelize
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database via Sequelize');
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../')); // Serve static files from parent directory

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../index.html');
});

// Start server with database initialization
async function startServer() {
  // Test database connection first
  await testDatabaseConnection();
  
  // Initialize database
  await initializeDatabase();
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}`);
    console.log(`🔌 API available at http://localhost:${PORT}/api`);
  });
}

// Start the application
startServer().catch(error => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

module.exports = app;