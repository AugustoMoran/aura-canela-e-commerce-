const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadImage, deleteImage, getStorageUsage } = require('../controllers/uploadController');

// Upload image endpoint
router.post('/', protect, adminOnly, uploadLimiter, uploadImage);

router.delete('/', protect, adminOnly, deleteImage);
router.get('/usage', protect, adminOnly, getStorageUsage);

module.exports = router;
