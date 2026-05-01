const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadImage, deleteImage, getStorageUsage } = require('../controllers/uploadController');

// Test endpoint - no auth required (REMOVE THIS IN PRODUCTION)
router.post('/test/cloudinary', uploadLimiter, uploadImage);

// Upload image endpoint
router.post('/', protect, adminOnly, uploadLimiter, uploadImage);

router.delete('/', protect, adminOnly, deleteImage);
router.get('/usage', protect, adminOnly, getStorageUsage);

module.exports = router;
