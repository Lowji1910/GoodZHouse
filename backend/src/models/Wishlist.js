const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  addedAt: { type: Date, default: Date.now },
  priceAtAdd: Number,
  notifyOnDiscount: { type: Boolean, default: false },
  notifyThreshold: { type: Number }, // Notify when price drops below this
});

const wishlistCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  isDefault: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String }, // For public sharing
  items: [wishlistItemSchema],
}, { timestamps: true });

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collections: [wishlistCollectionSchema],
  // Quick access to all items across collections
  allItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

// Ensure each user has a default collection
wishlistSchema.pre('save', function(next) {
  if (!this.collections.length || !this.collections.some(c => c.isDefault)) {
    this.collections.unshift({
      name: 'Danh sách yêu thích',
      isDefault: true,
      items: []
    });
  }
  // Update allItems based on all collections
  this.allItems = [...new Set(
    this.collections.flatMap(c => c.items.map(i => i.productId))
  )];
  next();
});

module.exports = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);