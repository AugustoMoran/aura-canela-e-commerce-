const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { protect, adminOnly } = require('../middleware/auth');

// Public route for checkout quotes
router.post('/cotizar', shippingController.quoteShippingController);

// Admin routes
router.get('/config', protect, adminOnly, shippingController.getShippingConfigController);
router.put('/config', protect, adminOnly, shippingController.updateShippingConfigController);
router.post('/sync-tracking', protect, adminOnly, shippingController.syncTrackingController);

module.exports = router;
