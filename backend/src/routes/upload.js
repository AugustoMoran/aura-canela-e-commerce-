const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { getUpload, uploadImage, deleteImage, getStorageUsage } = require('../controllers/uploadController');

// Create fresh multer instance for each upload request
router.post('/', protect, adminOnly, uploadLimiter, (req, res, next) => {
  getUpload().single('image')(req, res, (err) => {
    if (err) return next(err);
    uploadImage(req, res, next);
  });
});

router.delete('/', protect, adminOnly, deleteImage);
router.get('/usage', protect, adminOnly, getStorageUsage);

module.exports = router;
