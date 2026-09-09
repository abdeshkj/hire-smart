const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All profile endpoints currently require authentication
router.use(authenticate);

// Profile endpoints
router.post('/me', profileController.createOrUpdateProfile);
router.get('/me', profileController.getMyProfile);
router.get('/:userId', profileController.getProfileByUserId);

module.exports = router;
