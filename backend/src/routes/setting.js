const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Public: Get homepage display settings
// GET /api/settings/homepage
router.get('/homepage', settingController.getHomepageSettings);

// Public: Get a setting
// GET /api/settings/:key
router.get('/:key', settingController.getSetting);

// Admin: Save homepage display settings
// POST /api/admin/settings/homepage
router.post('/homepage', requireAuth, requireRole('admin'), settingController.saveHomepageSettings);

// Admin: Get all settings
// GET /api/admin/settings
router.get('/admin/all', requireAuth, requireRole('admin'), settingController.getAllSettings);

// Admin: Get available categories for selection
// GET /api/admin/settings/categories
router.get('/admin/categories', requireAuth, requireRole('admin'), settingController.getAvailableCategories);

// Admin: Update a setting
// PUT /api/settings/:key
router.put('/:key', requireAuth, requireRole('admin'), settingController.updateSetting);

module.exports = router;
