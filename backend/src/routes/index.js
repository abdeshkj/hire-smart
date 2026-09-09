const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const skillRoutes = require('./skill.routes');
const jobRoutes = require('./job.routes');
const applicationRoutes = require('./application.routes');

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
router.use('/profiles', profileRoutes);
router.use('/skills', skillRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);

module.exports = router;
