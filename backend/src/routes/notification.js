const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All routes require admin access
router.use(requireAuth, requireRole('admin'));

// Get all notifications (with filters)
router.get('/', notificationController.getNotifications);

// Get users for dropdown
router.get('/users/list', notificationController.getNotificationUsers);

// Create notification for specific user
router.post('/', notificationController.createNotification);

// Broadcast to all users
router.post('/broadcast', notificationController.broadcastNotification);

// Mark as read
router.patch('/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Delete all notifications for user
router.delete('/user/:userId', notificationController.deleteUserNotifications);

// Mark all notifications for a user as read
router.patch('/user/:userId/read', notificationController.markAllUserRead);

module.exports = router;
