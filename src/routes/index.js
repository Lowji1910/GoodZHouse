const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Health for API scope
router.get('/health', (req, res) => {
  res.json({ ok: true, scope: 'api' });
});

// Public: Active banners for homepage
router.get('/banners', async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    const now = new Date();
    const filter = {
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] }
      ]
    };
    const docs = await Banner.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('title subtitle imageUrl linkUrl')
      .lean();
    res.json(docs.map(b => ({ id: b._id, title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, linkUrl: b.linkUrl })));
  } catch (err) {
    next(err);
  }
});

// Products from MongoDB
router.get('/products', async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const { search, category, sort, min, max, page = 1, limit = 12 } = req.query;
    const filter = { isActive: { $ne: false } };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) {
      const mongoose = require('mongoose');
      const Category = require('../models/Category');
      
      // First try to find by slug
      const categoryDoc = await Category.findOne({ 
        $or: [
          { slug: category },
          // Also try as ObjectId if the string is valid
          ...(mongoose.Types.ObjectId.isValid(category) ? [{ _id: category }] : [])
        ]
      });

      if (!categoryDoc) {
        return res.status(404).json({ error: 'Category not found' });
      }

      filter.categoryIds = categoryDoc._id;
    }
    if (min || max) {
      filter.price = {};
      if (min) filter.price.$gte = Number(min);
      if (max) filter.price.$lte = Number(max);
    }

    const sortOpt = !sort
      ? { createdAt: -1 }
      : sort === 'price_asc'
      ? { price: 1 }
      : sort === 'price_desc'
      ? { price: -1 }
      : { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const countPromise = Product.countDocuments(filter);
    const docsPromise = Product.find(filter)
      .select('name price currency images slug sku stock rating reviewsCount')
      .sort(sortOpt)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const [total, docs] = await Promise.all([countPromise, docsPromise]);

    res.json({
      items: docs.map((d) => ({
        id: d._id,
        name: d.name,
        price: d.price,
        currency: d.currency,
        image: Array.isArray(d.images) ? d.images[0] : undefined,
        slug: d.slug,
        sku: d.sku,
        stock: d.stock,
        rating: d.rating,
        reviewsCount: d.reviewsCount,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
});

// Get product by id
router.get('/products/:id', async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const doc = await Product.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// Get product by slug
router.get('/products/slug/:slug', async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const doc = await Product.findOne({ slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// Categories
router.get('/categories', async (req, res, next) => {
  try {
    const Category = require('../models/Category');
    const docs = await Category.find({ isActive: { $ne: false } })
      .select('name slug description')
      .lean();
    res.json(docs.map((c) => ({ id: c._id, name: c.name, slug: c.slug, description: c.description })));
  } catch (err) {
    next(err);
  }
});

// Posts
router.get('/posts', async (req, res, next) => {
  try {
    const Post = require('../models/Post');
    const docs = await Post.find({ status: 'published' })
      .select('title slug excerpt createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(docs.map((p) => ({ id: p._id, title: p.title, slug: p.slug, excerpt: p.excerpt, createdAt: p.createdAt })));
  } catch (err) {
    next(err);
  }
});

// Get review statistics for a product
router.get('/reviews/stats/:productId', async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const stats = await Review.aggregate([
      { $match: { productId: req.params.productId, status: 'approved' } },
      { $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }},
      { $sort: { _id: -1 } }
    ]);
    
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const distribution = stats.map(s => ({
      rating: s._id,
      count: s.count,
      percentage: total ? (s.count / total * 100).toFixed(1) : 0
    }));

    res.json({ distribution, total });
  } catch (err) {
    next(err);
  }
});

// Reviews with sorting and filtering
router.get('/reviews', async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const { productId, rating, sort = '-createdAt', page = 1, limit = 10 } = req.query;
    
    const filter = { status: 'approved' };
    if (productId) filter.productId = productId;
    if (rating) filter.rating = Number(rating);
    
    const sortOptions = {
      '-createdAt': { createdAt: -1 },
      'createdAt': { createdAt: 1 },
      '-rating': { rating: -1 },
      'rating': { rating: 1 },
      '-likes': { likes: -1 }
    }[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    
    const [docs, total] = await Promise.all([
      Review.find(filter)
        .select('productId userId rating title content status createdAt images isVerifiedPurchase likes dislikes replies')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('replies.userId', 'fullName')
        .lean(),
      Review.countDocuments(filter)
    ]);
      
    res.json({
      items: docs.map(r => ({
        id: r._id,
        productId: r.productId,
        userId: r.userId,
        rating: r.rating,
        title: r.title,
        content: r.content,
        status: r.status,
        createdAt: r.createdAt,
        images: r.images,
        isVerifiedPurchase: r.isVerifiedPurchase,
        likes: r.likes,
        dislikes: r.dislikes,
        replies: r.replies
      })),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    next(err);
  }
});

// React to a review (like/dislike)
router.post('/reviews/:id/react', requireAuth, async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const { reaction } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Remove existing reaction if any
    const existingReaction = review.userReactions.find(r => r.userId.toString() === userId);
    if (existingReaction) {
      if (existingReaction.reaction === 'like') review.likes--;
      else review.dislikes--;
      review.userReactions = review.userReactions.filter(r => r.userId.toString() !== userId);
    }

    // Add new reaction
    if (reaction) {
      review.userReactions.push({ userId, reaction });
      if (reaction === 'like') review.likes++;
      else review.dislikes++;
    }

    await review.save();
    res.json({ likes: review.likes, dislikes: review.dislikes });
  } catch (err) {
    next(err);
  }
});

// Reply to a review
router.post('/reviews/:id/reply', requireAuth, async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const { content } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.replies.push({ userId, content, isAdmin });
    await review.save();

    res.status(201).json(review.replies[review.replies.length - 1]);
  } catch (err) {
    next(err);
  }
});

// Submit a new review
router.post('/reviews', requireAuth, async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const Product = require('../models/Product');
    
    const { productId, rating, title, content } = req.body;
    
    // Create review
    const review = new Review({
      productId,
      rating: Number(rating),
      title,
      content,
      status: 'approved', // For demo, auto-approve reviews
      userId: req.user.id
    });
    
    await review.save();
    
    // Update product rating
    const reviews = await Review.find({ 
      productId,
      status: 'approved'
    }).select('rating');
    
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      reviewsCount: reviews.length
    });
    
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// Users (public-safe fields only)
router.get('/users', async (req, res, next) => {
  try {
    const User = require('../models/User');
    const docs = await User.find({})
      .select('fullName email role isEmailVerified createdAt')
      .limit(50)
      .lean();
    res.json(docs.map((u) => ({ id: u._id, fullName: u.fullName, email: u.email, role: u.role, isEmailVerified: u.isEmailVerified })));
  } catch (err) {
    next(err);
  }
});

// Cart by userId
router.get('/carts', async (req, res, next) => {
  try {
    const Cart = require('../models/Cart');
    const userId = req.query.userId;
    const filter = userId ? { userId } : {};
    const docs = await Cart.find(filter).limit(10).lean();
    res.json(docs.map((c) => ({ id: c._id, userId: c.userId, items: c.items })));
  } catch (err) {
    next(err);
  }
});

// Orders (optionally filter by userId)
router.get('/orders', async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    const docs = await Order.find(filter)
      .select('userId items total status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(docs.map((o) => ({ id: o._id, userId: o.userId, items: o.items, total: o.total, status: o.status, createdAt: o.createdAt })));
  } catch (err) {
    next(err);
  }
});

// Current user's cart
router.get('/cart', requireAuth, async (req, res, next) => {
  try {
    const Cart = require('../models/Cart');
    const cart = await Cart.findOne({ userId: req.user.id }).lean();
    if (!cart) return res.json({ items: [] });
    res.json({ items: cart.items });
  } catch (err) { next(err); }
});

// Replace current user's cart
router.put('/cart', requireAuth, async (req, res, next) => {
  try {
    const Cart = require('../models/Cart');
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const normalized = items
      .filter(it => it && (it.productId || it.id))
      .map(it => ({
        productId: it.productId || it.id,
        quantity: Math.max(1, Number(it.quantity) || 1),
        priceAtAdd: it.priceAtAdd ?? it.price ?? 0,
      }));
    const doc = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { items: normalized } },
      { new: true, upsert: true }
    ).lean();
    res.json({ items: doc.items });
  } catch (err) { next(err); }
});

// Create order
router.post('/orders', requireAuth, async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const { items = [], paymentMethod = 'cod', shipping = {}, couponCode } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items' });
    }

    // Recalculate total from DB prices for safety
    const ids = items.map(it => it.productId || it.id);
    const prods = await Product.find({ _id: { $in: ids } }).select('price').lean();
    const priceMap = new Map(prods.map(p => [p._id.toString(), p.price]));
    const orderItems = items.map(it => ({
      productId: it.productId || it.id,
      quantity: Math.max(1, Number(it.quantity)||1),
      price: priceMap.get((it.productId || it.id).toString()) ?? (Number(it.price) || 0),
    }));
    let total = orderItems.reduce((s, it) => s + (it.price||0) * it.quantity, 0);

    // TODO: apply coupon validation in coupons route; here assume validated externally
    if (couponCode && req.query?.skipCoupon !== '1') {
      // keep simple, do not change total here
    }

    const order = await Order.create({ userId: req.user.id, items: orderItems, total, status: 'pending' });
    res.status(201).json({ id: order._id.toString(), total: order.total, status: order.status });
  } catch (err) { next(err); }
});

// Get order by id (only owner or admin)
router.get('/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.userId?.toString?.() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({ id: order._id, userId: order.userId, items: order.items, total: order.total, status: order.status, createdAt: order.createdAt });
  } catch (err) { next(err); }
});

module.exports = router;

