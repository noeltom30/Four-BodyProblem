require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Admin defaults
  adminEmail: process.env.ADMIN_DEFAULT_EMAIL || 'admin@converge.com',
  adminPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456',
  
  // File upload
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  uploadDir: './uploads',
  
  // Credit score weights
  creditScoreWeights: {
    totalTransactions: 0.2,
    avgTransactionAmount: 0.15,
    creditToDebitRatio: 0.3,
    transactionFrequency: 0.15,
    recentActivity: 0.2,
  },
};
