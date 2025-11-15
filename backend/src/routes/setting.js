const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// GET /api/settings/:key - Get a setting
router.get('/:key', settingController.getSetting);

// PUT /api/settings/:key - Update a setting
router.put('/:key', authMiddleware, adminMiddleware, settingController.updateSetting);

module.exports = router;
