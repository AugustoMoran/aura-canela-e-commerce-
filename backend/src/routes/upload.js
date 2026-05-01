const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { upload, uploadImage, deleteImage, getStorageUsage, ensureCloudinaryInit } = require('../controllers/uploadController');

// Ensure cloudinary is initialized before any upload operations
router.use(ensureCloudinaryInit);

router.post('/', protect, adminOnly, uploadLimiter, upload.single('image'), uploadImage);
router.delete('/', protect, adminOnly, deleteImage);
router.get('/usage', protect, adminOnly, getStorageUsage);

module.exports = router;
