const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skill.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All skill routes require authentication for now
router.use(authenticate);

// Skill routes
router.get('/', skillController.listSkills);
router.post('/', skillController.createSkill);
router.get('/me', skillController.getMySkills);
router.post('/me', skillController.addMySkill);
router.delete('/me/:skillId', skillController.removeMySkill);

module.exports = router;
