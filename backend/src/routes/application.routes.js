const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All application routes require authentication
router.use(authenticate);

// Application routes
router.post('/', applicationController.applyToJob);
router.get('/mine', applicationController.getMyApplications);
router.get('/job/:jobId', applicationController.getJobApplicants);
router.patch('/:applicationId/status', applicationController.updateApplicationStatus);
router.patch('/:applicationId/withdraw', applicationController.withdrawMyApplication);

module.exports = router;
