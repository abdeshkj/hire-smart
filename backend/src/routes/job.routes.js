const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All job routes require authentication
router.use(authenticate);

// Job routes
router.post('/', jobController.createJob);
router.get('/', jobController.listJobs);
router.get('/mine', jobController.getMyJobs);
router.get('/:jobId', jobController.getJobById);
router.patch('/:jobId/status', jobController.updateJobStatus);

module.exports = router;
