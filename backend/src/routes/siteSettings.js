const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', siteSettingsController.getSettings);
router.put('/', protect, adminOnly, siteSettingsController.updateSettings);

module.exports = router;
