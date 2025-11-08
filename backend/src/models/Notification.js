const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null => admin-wide
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
