const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, notificationController.getNotificationsController);
router.patch('/marcar-todas', protect, notificationController.markAllAsReadController);
router.patch('/:id/leida', protect, notificationController.markAsReadController);

module.exports = router;
