const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('node:path');
const config = require('./config');
const bcrypt = require('bcryptjs');
const db = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const kycRoutes = require('./routes/kycRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const partnerRoutes = require('./routes/partnerRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Serve uploaded files (in production, use cloud storage)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Converge API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/partner', partnerRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Converge KYC API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      kyc: '/api/kyc',
      transactions: '/api/transactions',
      partner: '/api/partner'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Simple delay helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ensure a default admin user exists (configured via env or defaults)
const ensureAdminUser = async () => {
  const email = config.adminEmail;
  const password = config.adminPassword;
  const fullName = 'System Administrator';

  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    console.log(`✓ Admin user already present: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const userResult = await db.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'admin')
     RETURNING id`,
    [email, passwordHash, fullName]
  );

  const userId = userResult.rows[0].id;

  await db.query(
    `INSERT INTO kyc_profiles (user_id, country)
     VALUES ($1, $2)`,
    [userId, 'India']
  );

  console.log(`✓ Default admin created: ${email}`);
};

// Start server with basic retry logic for transient DB/DNS issues
const startServer = async () => {
  const maxAttempts = 5;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      // Test database connection
      await db.query('SELECT NOW()');
      console.log('✓ Database connection established');

      // Ensure default admin exists
      await ensureAdminUser();

      // Start listening
      app.listen(config.port, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║      🚀 Converge KYC API Server Running          ║
║                                                   ║
║      Environment: ${config.nodeEnv.padEnd(33)}║
║      Port: ${config.port.toString().padEnd(40)}║
║      Time: ${new Date().toLocaleString().padEnd(40)}║
║                                                   ║
╚═══════════════════════════════════════════════════╝
        `);
      });

      // Successfully started, exit the retry loop
      return;
    } catch (error) {
      console.error(`Failed to start server (attempt ${attempt}/${maxAttempts}):`, error);

      if (attempt >= maxAttempts) {
        console.error('Max retry attempts reached. Exiting.');
        process.exit(1);
      }

      // Wait before retrying (exponential backoff)
      const delayMs = attempt * 3000;
      console.log(`Retrying in ${delayMs / 1000}s...`);
      await wait(delayMs);
    }
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
