const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true },
    excerpt: String,
    content: String, // can be HTML
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);

