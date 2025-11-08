const mongoose = require('mongoose');

const reviewReplySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    content: String,
    images: [{ type: String }], // URLs to review images
    isVerifiedPurchase: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    userReactions: [{ 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reaction: { type: String, enum: ['like', 'dislike'] }
    }],
    replies: [reviewReplySchema],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);

