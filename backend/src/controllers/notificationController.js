const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Get all notifications (Admin)
 * @desc    GET /api/admin/notifications
 * @access  Admin
 */
const getNotifications = async (req, res) => {
  try {
    const { userId, type, isRead, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter)
      .populate('userId', 'fullName email')
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.json({
      items: notifications,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

/**
 * Create and send notification
 * @desc    POST /api/admin/notifications
 * @access  Admin
 */
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info', orderId } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Validate userId exists if provided
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    const notification = new Notification({
      userId: userId || null,
      title,
      message,
      type,
      orderId,
      isRead: false,
    });

    await notification.save();
    await notification.populate('userId', 'fullName email');
    await notification.populate('orderId', 'orderNumber status');

    // Emit via socket if user is online
    const io = req.app.get('io');
    if (io && userId) {
      io.to(`user:${userId}`).emit('notifications:new', notification);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create Notification Error:', error);
    res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
};

/**
 * Get users for select dropdown
 * @desc    GET /api/admin/notifications/users
 * @access  Admin
 */
const getNotificationUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id fullName email')
      .sort({ fullName: 1 });

    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

/**
 * Mark notification as read
 * @desc    PATCH /api/admin/notifications/:id/read
 * @access  Admin
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).populate('userId', 'fullName email');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
};

/**
 * Delete notification
 * @desc    DELETE /api/admin/notifications/:id
 * @access  Admin
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted', id: req.params.id });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

/**
 * Delete all notifications for a user
 * @desc    DELETE /api/admin/notifications/user/:userId
 * @access  Admin
 */
const deleteUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.deleteMany({ userId });

    res.json({ message: 'User notifications deleted', deleted: result.deletedCount });
  } catch (error) {
    console.error('Delete User Notifications Error:', error);
    res.status(500).json({ message: 'Failed to delete notifications', error: error.message });
  }
};

/**
 * Mark all notifications for a user as read
 * @desc    PATCH /api/admin/notifications/user/:userId/read
 * @access  Admin
 */
const markAllUserRead = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });

    const result = await Notification.updateMany({ userId }, { $set: { isRead: true } });
    res.json({ message: 'Marked as read', modified: result.nModified || result.modifiedCount });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read', error: error.message });
  }
};

/**
 * Broadcast notification to all users
 * @desc    POST /api/admin/notifications/broadcast
 * @access  Admin
 */
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type = 'info' } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Create notification for each user
    const users = await User.find({}).select('_id');
    const notifications = users.map(u => ({
      userId: u._id,
      title,
      message,
      type,
      isRead: false,
    }));

    const created = await Notification.insertMany(notifications);

    // Emit via socket to all users
    const io = req.app.get('io');
    if (io) {
      users.forEach(u => {
        io.to(`user:${u._id}`).emit('notifications:new', { title, message, type });
      });
    }

    res.status(201).json({
      message: 'Broadcast notification sent',
      count: created.length,
    });
  } catch (error) {
    console.error('Broadcast Notification Error:', error);
    res.status(500).json({ message: 'Failed to broadcast notification', error: error.message });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  getNotificationUsers,
  markAsRead,
  deleteNotification,
  deleteUserNotifications,
  broadcastNotification,
  markAllUserRead,
};
