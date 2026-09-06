const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file if present
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_BASE_URL: process.env.API_BASE_URL || '/api',
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hiresmart_dev',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/hiresmart_dev',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_here',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret_here',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  ML_SERVICE_API_KEY: process.env.ML_SERVICE_API_KEY || 'your_ml_service_api_key_here',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
