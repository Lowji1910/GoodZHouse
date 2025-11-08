const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    fullName: String,
    phone: String,
    address: String,
    isEmailVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

