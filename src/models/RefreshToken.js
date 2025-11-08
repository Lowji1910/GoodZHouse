const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, index: true, unique: true },
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
