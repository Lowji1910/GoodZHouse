const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, index: true },
    name: { type: String, required: true },
    slug: { type: String, index: true },
    shortDescription: String,
    description: String,
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    price: { type: Number, required: true },
    compareAtPrice: Number,
    currency: { type: String, default: 'VND' },
    stock: { type: Number, default: 0 },
    images: [{ type: String }],
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

