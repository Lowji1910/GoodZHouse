const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    imageUrl: { type: String, required: true },
    linkUrl: String,
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
