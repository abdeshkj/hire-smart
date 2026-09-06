const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const env = require('./config/env.config');

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true
}));

// Request logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'HireSmart Backend API',
    version: '1.0.0',
    documentation: '/docs',
    health: '/api/health'
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
