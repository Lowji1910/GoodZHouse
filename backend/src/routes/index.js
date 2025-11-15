const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Health for API scope
router.get('/health', (req, res) => {
  res.json({ ok: true, scope: 'api' });
});

// =============== Admin: Categories List (paginated) ===============
router.get('/admin/categories', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Category = require('../models/Category');
    const Product = require('../models/Product');
    const q = String(req.query.q || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
    const filter = { isActive: { $ne: false } };
    if (q) filter.name = { $regex: q, $options: 'i' };
    const total = await Category.countDocuments(filter);
    const items = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    // Count products per category in one query
    const ids = items.map(c => c._id);
    const counts = await Product.aggregate([
      { $match: { categoryIds: { $in: ids } } },
      { $unwind: '$categoryIds' },
      { $match: { categoryIds: { $in: ids } } },
      { $group: { _id: '$categoryIds', count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(counts.map(c => [String(c._id), c.count]));
    res.json({
      items: items.map(c => ({ id: c._id, name: c.name, slug: c.slug, isActive: c.isActive !== false, productCount: countMap[String(c._id)] || 0 })),
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) { next(err); }
});

// ======= Persistent Cart (current user) =======
router.get('/cart', requireAuth, async (req, res, next) => {
  try {
    const Cart = require('../models/Cart');
    const doc = await Cart.findOne({ userId: req.user.id }).lean();
    res.json({ items: doc?.items || [] });
  } catch (err) { next(err); }
});

// Replace whole cart
router.put('/cart', requireAuth, async (req, res, next) => {
  try {
    const Cart = require('../models/Cart');
    const items = Array.isArray(req.body?.items) ? req.body.items.map(it => ({
      productId: it.productId || it.id,
      quantity: Number(it.quantity) || 1,
      priceAtAdd: Number(it.price) || it.priceAtAdd || 0
    })) : [];
    const doc = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, items },
      { new: true, upsert: true }
    ).lean();
    res.json({ items: doc.items });
  } catch (err) { next(err); }
});

// Add or update a single item
router.patch('/cart', requireAuth, async (req, res, next) => {
  try {
    const Cart = require('../models/Cart');
    const { productId, quantity = 1, price } = req.body || {};
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const doc = await Cart.findOne({ userId: req.user.id });
    if (!doc) {
      const created = await Cart.create({ userId: req.user.id, items: [{ productId, quantity: Number(quantity)||1, priceAtAdd: Number(price)||0 }] });
      return res.json({ items: created.items });
    }
    const idx = doc.items.findIndex(i => String(i.productId) === String(productId));
    if (idx >= 0) {
      doc.items[idx].quantity = Math.max(1, Number(quantity)||1);
      if (price !== undefined) doc.items[idx].priceAtAdd = Number(price)||0;
    } else {
      doc.items.push({ productId, quantity: Number(quantity)||1, priceAtAdd: Number(price)||0 });
    }
    await doc.save();
    res.json({ items: doc.items });
  } catch (err) { next(err); }
});

// Remove item or clear
router.delete('/cart', requireAuth, async (req, res, next) => {
  try {
    const Cart = require('../models/Cart');
    const { productId } = req.body || {};
    if (!productId) {
      await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [] }, { upsert: true });
      return res.status(204).end();
    }
    const doc = await Cart.findOne({ userId: req.user.id });
    if (!doc) return res.status(204).end();
    doc.items = doc.items.filter(i => String(i.productId) !== String(productId));
    await doc.save();
    res.status(204).end();
  } catch (err) { next(err); }
});

// Public: Active banners for homepage
router.get('/banners', async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    const now = new Date();
    const filter = {
      isActive: true,
      $and: [
        {
          $or: [
            { startsAt: null },
            { startsAt: '' },
            { startsAt: { $exists: false } },
            { startsAt: { $lte: now } }
          ]
        },
        {
          $or: [
            { endsAt: null },
            { endsAt: '' },
            { endsAt: { $exists: false } },
            { endsAt: { $gte: now } }
          ]
        }
      ]
    };
    let docs = await Banner.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('title subtitle imageUrl linkUrl')
      .lean();
    if (!docs || docs.length === 0) {
      // Fallback: show latest banners even if time window not set properly
      docs = await Banner.find({ isActive: { $ne: false } })
        .sort({ order: 1, createdAt: -1 })
        .limit(5)
        .select('title subtitle imageUrl linkUrl')
        .lean();
    }
    res.set('Cache-Control', 'no-store, max-age=0');
    res.json(docs.map(b => ({ id: b._id, title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, linkUrl: b.linkUrl })));
  } catch (err) {
    next(err);
  }
});

// Get products on sale
router.get('/products/on-sale', async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const docs = await Product.find({
      isActive: { $ne: false },
      salePrice: { $exists: true, $ne: null },
      $expr: { $lt: [ "$salePrice", "$price" ] }
    })
    .select('name price salePrice currency images slug')
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

    res.json({
      items: docs.map((d) => ({
        id: d._id,
        name: d.name,
        price: d.salePrice,
        originalPrice: d.price,
        currency: d.currency,
        image: Array.isArray(d.images) ? d.images[0] : undefined,
        slug: d.slug,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// =============== Admin: Banners CRUD ===============
router.get('/admin/banners', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    const docs = await Banner.find({}).sort({ order: 1, createdAt: -1 }).lean();
    res.json(docs.map(b => ({
      id: b._id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      order: b.order || 0,
      isActive: b.isActive !== false,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
    })));
  } catch (err) { next(err); }
});

router.post('/admin/banners', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    const payload = req.body || {};
    const created = await Banner.create({
      title: payload.title || '',
      subtitle: payload.subtitle || '',
      imageUrl: payload.imageUrl,
      linkUrl: payload.linkUrl || '',
      order: Number(payload.order) || 0,
      isActive: payload.isActive !== false,
      startsAt: payload.startsAt || null,
      endsAt: payload.endsAt || null,
    });
    res.status(201).json({ id: created._id });
  } catch (err) { next(err); }
});

router.put('/admin/banners/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    const updates = req.body || {};
    const updated = await Banner.findByIdAndUpdate(req.params.id, {
      title: updates.title,
      subtitle: updates.subtitle,
      imageUrl: updates.imageUrl,
      linkUrl: updates.linkUrl,
      order: Number(updates.order) || 0,
      isActive: updates.isActive !== false,
      startsAt: updates.startsAt || null,
      endsAt: updates.endsAt || null,
    }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ id: updated._id });
  } catch (err) { next(err); }
});

router.delete('/admin/banners/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    // Soft delete by setting isActive=false
    const updated = await Banner.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// Update order status (admin) and emit notification
router.patch('/orders/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const Notification = require('../models/Notification');
    const { getIO } = require('../realtime/socket');
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: 'Missing status' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Map status to Vietnamese label for user-friendly notifications
    const statusLabelMap = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipping: 'Đang giao',
      delivered: 'Hoàn thành',
      completed: 'Hoàn thành',
      canceled: 'Đã hủy',
      cancelled: 'Đã hủy'
    };
    const label = statusLabelMap[String(order.status)] || String(order.status);
    // Notify customer
    const note = await Notification.create({
      userId: order.userId,
      type: 'order_status_updated',
      title: 'Cập nhật trạng thái đơn hàng',
      message: `Đơn ${order._id} hiện ${label}`,
      orderId: order._id,
    });
    try {
      const io = getIO();
      io.to(`user:${order.userId}`).emit('order:status', { orderId: order._id, status, label, updatedAt: order.updatedAt });
      io.to(`user:${order.userId}`).emit('notifications:new', { id: note._id, type: note.type, title: note.title, message: note.message, orderId: note.orderId, createdAt: note.createdAt });
    } catch {}
    res.json({ id: order._id, status: order.status });
  } catch (err) { next(err); }
});

// ================= Notifications =================
router.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? { $or: [{ userId: null }, { userId: req.user.id }] } : { userId: req.user.id };
    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    res.json(items.map(n => ({ id: n._id, userId: n.userId, type: n.type, title: n.title, message: n.message, orderId: n.orderId, isRead: n.isRead, createdAt: n.createdAt })));
  } catch (err) { next(err); }
});

router.patch('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    const Notification = require('../models/Notification');
    const isAdmin = req.user.role === 'admin';
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Not found' });
    if (!isAdmin && String(n.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    n.isRead = true;
    await n.save();
    res.json({ id: n._id, isRead: n.isRead });
  } catch (err) { next(err); }
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
      const q = String(category);
      if (mongoose.Types.ObjectId.isValid(q)) {
        const oid = new mongoose.Types.ObjectId(q);
        filter.$or = [
          { categoryIds: { $in: [oid, q] } },
          { categoryId: { $in: [oid, q] } },
        ];
      } else {
        // Try by slug, normalized slug (remove accents, spaces -> -), or name (case-insensitive)
        const norm = String(q)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/\s+/g, '-');
        const categoryDoc = await Category.findOne({
          $or: [
            { slug: q },
            { slug: norm },
            { name: { $regex: `^${q}$`, $options: 'i' } }
          ]
        });
        if (!categoryDoc) {
          return res.status(404).json({ error: 'Category not found' });
        }
        filter.$or = [
          { categoryIds: { $in: [categoryDoc._id, String(categoryDoc._id)] } },
          { categoryId: { $in: [categoryDoc._id, String(categoryDoc._id)] } },
        ];
      }
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

// Admin: Create category
router.post('/categories', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Category = require('../models/Category');
    let { name, slug, description = '', isActive = true } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'name is required' });
    if (!slug || !String(slug).trim()) {
      slug = String(name)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim().replace(/\s+/g, '-');
    }
    const created = await Category.create({ name: String(name).trim(), slug: String(slug).trim(), description: String(description||''), isActive: Boolean(isActive) });
    res.status(201).json({ id: created._id });
  } catch (err) { next(err); }
});

// Admin: Update category
router.patch('/categories/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Category = require('../models/Category');
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.slug !== undefined) updates.slug = String(req.body.slug).trim();
    if (req.body.description !== undefined) updates.description = String(req.body.description||'');
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    if (updates.name && !updates.slug) {
      updates.slug = updates.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim().replace(/\s+/g, '-');
    }
    const updated = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ id: updated._id });
  } catch (err) { next(err); }
});

// Admin: Soft delete category (set isActive=false)
router.delete('/categories/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Category = require('../models/Category');
    const updated = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
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

// =============== Admin: Users management ===============
router.get('/admin/users', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const docs = await User.find({}).select('fullName email role isEmailVerified isSuspended createdAt phone address').sort({ createdAt: -1 }).limit(200).lean();
    res.json(docs.map(u => ({ id: u._id, fullName: u.fullName, email: u.email, role: u.role, isEmailVerified: u.isEmailVerified, isSuspended: !!u.isSuspended, createdAt: u.createdAt, phone: u.phone || '', address: u.address || '' })));
  } catch (err) { next(err); }
});

router.get('/admin/users/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const u = await User.findById(req.params.id).select('fullName email phone address role isEmailVerified isSuspended createdAt').lean();
    if (!u) return res.status(404).json({ message: 'Not found' });
    res.json({ id: u._id, fullName: u.fullName, email: u.email, phone: u.phone || '', address: u.address || '', role: u.role, isEmailVerified: u.isEmailVerified, isSuspended: !!u.isSuspended, createdAt: u.createdAt });
  } catch (err) { next(err); }
});

router.patch('/admin/users/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const updates = {};
    if (req.body.role) updates.role = req.body.role === 'admin' ? 'admin' : 'customer';
    if (typeof req.body.isSuspended === 'boolean') updates.isSuspended = req.body.isSuspended;
    if (req.body.fullName !== undefined) updates.fullName = String(req.body.fullName || '');
    if (req.body.phone !== undefined) updates.phone = String(req.body.phone || '');
    if (req.body.address !== undefined) updates.address = String(req.body.address || '');
    if (typeof req.body.isEmailVerified === 'boolean') updates.isEmailVerified = req.body.isEmailVerified;
    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ id: updated._id });
  } catch (err) { next(err); }
});

router.delete('/admin/users/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const done = await User.findByIdAndDelete(req.params.id);
    if (!done) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
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

// Create a new order
router.post('/orders', requireAuth, async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const { getIO } = require('../realtime/socket');
    const Coupon = require('../models/Coupon');
    const { items = [], paymentMethod = 'cod', shipping = {}, couponCode } = req.body || {};

    // Block suspended users from placing orders
    try {
      const u = await User.findById(req.user.id).select('isSuspended').lean();
      if (u && u.isSuspended) {
        return res.status(403).json({ message: 'Tài khoản đã bị khóa. Không thể đặt hàng.' });
      }
    } catch {}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    // Normalize items to schema { productId, quantity, price }
    const normalizedItems = items.map((it) => ({
      productId: it.productId || it.id,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
    }));

    const subtotal = normalizedItems.reduce((s, it) => s + (it.price * it.quantity), 0);

    // Apply coupon if provided
    let discount = 0;
    let appliedCode = undefined;
    if (couponCode) {
      const now = new Date();
      const c = await Coupon.findOne({ code: String(couponCode).toUpperCase(), isActive: true }).lean();
      if (c && (!c.startsAt || c.startsAt <= now) && (!c.endsAt || c.endsAt >= now) && (!c.usageLimit || c.usedCount < c.usageLimit) && subtotal >= (c.minOrder || 0)) {
        if (c.type === 'percent') {
          discount = Math.floor(subtotal * (c.value / 100));
          if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
        } else {
          discount = Math.min(c.value, subtotal);
        }
        appliedCode = c.code;
      }
    }

    const total = Math.max(0, subtotal - discount);

    const order = await Order.create({
      userId: req.user.id,
      items: normalizedItems,
      total,
      discount,
      couponCode: appliedCode,
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    });

    // Placeholder payment data; to be replaced when integrating MoMo/VNPay
    const payment = {
      method: paymentMethod,
      amount: total,
      url: null,
    };

    // Create notifications and emit
    try {
      // For customer
      const nUser = await Notification.create({
        userId: order.userId,
        type: 'order_created',
        title: 'Đơn hàng đã được tạo',
        message: `Mã đơn ${order._id} tổng ${total.toLocaleString('vi-VN')}₫`,
        orderId: order._id,
      });
      // For admin
      const nAdmin = await Notification.create({
        userId: null,
        type: 'admin_new_order',
        title: 'Đơn hàng mới',
        message: `Đơn ${order._id} từ người dùng ${order.userId}`,
        orderId: order._id,
      });
      // Emit realtime
      const io = getIO();
      io.to(`user:${order.userId}`).emit('order:created', { orderId: order._id, total: order.total, createdAt: order.createdAt });
      io.to(`user:${order.userId}`).emit('notifications:new', { id: nUser._id, type: nUser.type, title: nUser.title, message: nUser.message, orderId: nUser.orderId, createdAt: nUser.createdAt });
      io.to('admin').emit('notifications:new', { id: nAdmin._id, type: nAdmin.type, title: nAdmin.title, message: nAdmin.message, orderId: nAdmin.orderId, createdAt: nAdmin.createdAt });
    } catch {}

    res.status(201).json({ id: order._id, status: order.status, total: order.total, discount: order.discount, couponCode: order.couponCode, payment });
  } catch (err) {
    next(err);
  }
});

// Get order by id (owner or admin)
router.get('/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.userId?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    res.json({ id: order._id, items: order.items, total: order.total, discount: order.discount || 0, couponCode: order.couponCode || null, status: order.status, userId: order.userId });
  } catch (err) {
    next(err);
  }
});

// ================= Coupons =================
// Validate coupon (public)
router.get('/coupons/validate', async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const code = String(req.query.code || '').toUpperCase();
    const subtotal = Number(req.query.subtotal || 0);
    if (!code) return res.status(400).json({ message: 'code is required' });
    const now = new Date();
    const c = await Coupon.findOne({ code, isActive: true }).lean();
    if (!c) return res.status(404).json({ message: 'Coupon not found' });
    if ((c.startsAt && c.startsAt > now) || (c.endsAt && c.endsAt < now)) {
      return res.status(400).json({ message: 'Coupon not valid at this time' });
    }
    if (c.usageLimit && c.usedCount >= c.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }
    if (subtotal < (c.minOrder || 0)) {
      return res.status(400).json({ message: 'Subtotal does not meet minimum order' });
    }
    let discount = 0;
    if (c.type === 'percent') {
      discount = Math.floor(subtotal * (c.value / 100));
      if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
    } else {
      discount = Math.min(c.value, subtotal);
    }
    res.json({ code: c.code, discount, subtotal, total: Math.max(0, subtotal - discount) });
  } catch (err) {
    next(err);
  }
});

// List coupons (admin)
router.get('/coupons', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const docs = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    res.json(docs.map(c => ({ id: c._id, code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxDiscount: c.maxDiscount, startsAt: c.startsAt, endsAt: c.endsAt, usageLimit: c.usageLimit, usedCount: c.usedCount, isActive: c.isActive })));
  } catch (err) {
    next(err);
  }
});

// Create coupon (admin)
router.post('/coupons', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const payload = req.body || {};
    payload.code = String(payload.code || '').toUpperCase();
    const created = await Coupon.create(payload);
    res.status(201).json({ id: created._id });
  } catch (err) {
    next(err);
  }
});

// Update coupon (admin)
router.patch('/coupons/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const updates = req.body || {};
    if (updates.code) updates.code = String(updates.code).toUpperCase();
    const updated = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ id: updated._id });
  } catch (err) {
    next(err);
  }
});

// Delete coupon (admin)
router.delete('/coupons/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ================= Chat REST =================
// List conversations (admin): distinct userIds from messages excluding current admin id
router.get('/chat/conversations', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const Message = require('../models/Message');
    const User = require('../models/User');
    const adminId = req.user.id;
    const adminObjId = new mongoose.Types.ObjectId(adminId);
    const convs = await Message.aggregate([
      { $match: { $or: [ { from: { $ne: null } }, { to: { $ne: null } } ] } },
      { $project: { other: { $cond: [ { $eq: ['$from', adminObjId] }, '$to', '$from' ] }, createdAt: '$createdAt', content: '$content' } },
      { $match: { other: { $ne: null } } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$other', lastAt: { $last: '$createdAt' }, lastMessage: { $last: '$content' } } },
      { $sort: { lastAt: -1 } },
      { $limit: 100 }
    ]);
    const ids = convs.map(c => c._id);
    const users = await User.find({ _id: { $in: ids } }).select('fullName email').lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));
    res.json(convs.map(c => ({ userId: String(c._id), fullName: userMap[String(c._id)]?.fullName || null, email: userMap[String(c._id)]?.email || null, lastMessage: c.lastMessage || null, lastAt: c.lastAt })));
  } catch (err) { next(err); }
});

// List messages in a conversation
// Admin: require ?with=<userId>
// User: returns messages to/from current user only
router.get('/chat/messages', requireAuth, async (req, res, next) => {
  try {
    const Message = require('../models/Message');
    const { with: withId, limit = 50 } = req.query;
    const isAdmin = req.user.role === 'admin';
    let filter;
    if (isAdmin) {
      if (!withId) return res.status(400).json({ message: 'with is required' });
      filter = { $or: [ { from: withId }, { to: withId } ] };
    } else {
      const uid = req.user.id;
      filter = { $or: [ { from: uid }, { to: uid } ] };
    }
    const docs = await Message.find(filter).sort({ createdAt: 1 }).limit(Number(limit)).lean();
    res.json(docs.map(m => ({ id: m._id, from: String(m.from), to: m.to ? String(m.to) : null, content: m.content, createdAt: m.createdAt })));
  } catch (err) { next(err); }
});

// Send a message via HTTP (auth required)
router.post('/chat/messages', requireAuth, async (req, res, next) => {
  try {
    const { toUserId = null, content } = req.body || {};
    if (!content) return res.status(400).json({ message: 'content is required' });
    const Message = require('../models/Message');
    const { getIO } = require('../realtime/socket');
    const created = await Message.create({ from: req.user.id, to: toUserId || null, content: String(content).slice(0, 2000) });
    const payload = { from: String(created.from), to: created.to ? String(created.to) : null, content: created.content, createdAt: created.createdAt };
    try {
      const io = getIO();
      if (toUserId) io.to(`user:${toUserId}`).emit('chat:message', payload);
      else io.to('admin').emit('chat:message', payload);
      io.to(`user:${req.user.id}`).emit('chat:message', payload);
    } catch {}
    res.status(201).json({ id: created._id });
  } catch (err) { next(err); }
});

module.exports = router;
