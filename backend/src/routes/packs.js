const express = require('express');
const router = express.Router();
const packController = require('../controllers/packController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes for clients
router.get('/', packController.getPacksController);
router.get('/categoria/:categoriaId', packController.getPacksByCategoryController);
router.get('/:id', packController.getPackByIdController);

// Admin routes
router.post('/', protect, adminOnly, packController.createPackController);
router.put('/:id', protect, adminOnly, packController.updatePackController);
router.delete('/:id', protect, adminOnly, packController.deletePackController);

module.exports = router;
