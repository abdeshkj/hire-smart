const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hire-smart-backend'
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);

module.exports = router;
