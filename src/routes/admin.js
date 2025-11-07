const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');

const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Banner = require('../models/Banner');
const mongoose = require('mongoose');

const router = express.Router();

// Protect all admin routes
router.use(requireAuth, requireRole('admin'));

// Dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalOrders, totalProducts, totalUsers, recentOrdersRaw] = await Promise.all([
      Order.countDocuments({}),
      Product.countDocuments({}),
      User.countDocuments({}),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select('userId total status createdAt')
        .populate('userId', 'fullName email')
        .lean()
    ]);

    const recentOrders = recentOrdersRaw.map(o => ({
      id: o._id,
      code: String(o._id).slice(-6).toUpperCase(),
      customerName: o.userId?.fullName || o.userId?.email || 'N/A',
      total: o.total,
      status: o.status,
      createdAt: o.createdAt
    }));

    res.json({ totalOrders, totalProducts, totalUsers, recentOrders });
  } catch (err) {
    next(err);
  }
});

// Products - return all
router.get('/products', async (req, res, next) => {
  try {
    const { q, page, limit = 8 } = req.query;
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };

    const baseQuery = Product.find(filter)
      .select('name price images stock categoryIds')
      .populate({ path: 'categoryIds', select: 'name slug' })
      .lean();

    if (!page) {
      const docs = await baseQuery;
      const items = docs.map(d => ({
        id: d._id,
        name: d.name,
        price: d.price,
        image: Array.isArray(d.images) ? d.images[0] : undefined,
        inStock: (d.stock || 0) > 0,
        category: Array.isArray(d.categoryIds) && d.categoryIds.length ? { name: d.categoryIds[0].name, slug: d.categoryIds[0].slug } : null
      }));
      return res.json(items);
    }

    const p = Math.max(1, Number(page));
    const lim = Math.max(1, Number(limit));
    const skip = (p - 1) * lim;
    const [total, docs] = await Promise.all([
      Product.countDocuments(filter),
      baseQuery.sort({ createdAt: -1 }).skip(skip).limit(lim)
    ]);
    const items = docs.map(d => ({
      id: d._id,
      name: d.name,
      price: d.price,
      image: Array.isArray(d.images) ? d.images[0] : undefined,
      inStock: (d.stock || 0) > 0,
      category: Array.isArray(d.categoryIds) && d.categoryIds.length ? { name: d.categoryIds[0].name, slug: d.categoryIds[0].slug } : null
    }));
    res.json({ items, total, page: p, pages: Math.ceil(total / lim) });
  } catch (err) {
    next(err);
  }
});

// Categories - return all with productCount
router.get('/categories', async (req, res, next) => {
  try {
    const { q, page, limit = 8 } = req.query;
    const filter = {};
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } }
    ];
    const catsQuery = Category.find(filter).select('name slug').lean();
    const counts = await Product.aggregate([
      { $unwind: { path: '$categoryIds', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$categoryIds', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map(c => [String(c._id), c.count]));

    if (!page) {
      const cats = await catsQuery;
      const items = cats.map(c => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
        productCount: countMap.get(String(c._id)) || 0
      }));
      return res.json(items);
    }

    const p = Math.max(1, Number(page));
    const lim = Math.max(1, Number(limit));
    const skip = (p - 1) * lim;
    const [total, cats] = await Promise.all([
      Category.countDocuments(filter),
      catsQuery.sort({ createdAt: -1 }).skip(skip).limit(lim)
    ]);
    const items = cats.map(c => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      productCount: countMap.get(String(c._id)) || 0
    }));
    res.json({ items, total, page: p, pages: Math.ceil(total / lim) });
  } catch (err) {
    next(err);
  }
});

// Orders - return all
router.get('/orders', async (req, res, next) => {
  try {
    const { q, status, from, to, page, limit = 8 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    let userFilter = {};
    if (q) {
      // search by customer name/email
      const users = await User.find({ $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ] }).select('_id').lean();
      const ids = users.map(u => u._id);
      if (ids.length) filter.userId = { $in: ids };
      else filter.userId = null; // no match
    }

    const baseQuery = Order.find(filter)
      .sort({ createdAt: -1 })
      .select('userId items total status createdAt')
      .populate('userId', 'fullName email')
      .lean();

    if (!page) {
      const orders = await baseQuery;
      const items = orders.map(o => ({
        id: o._id,
        code: String(o._id).slice(-6).toUpperCase(),
        customerName: o.userId?.fullName || o.userId?.email || 'N/A',
        total: o.total,
        status: o.status,
        createdAt: o.createdAt
      }));
      return res.json(items);
    }

    const p = Math.max(1, Number(page));
    const lim = Math.max(1, Number(limit));
    const skip = (p - 1) * lim;
    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      baseQuery.skip(skip).limit(lim)
    ]);
    const items = orders.map(o => ({
      id: o._id,
      code: String(o._id).slice(-6).toUpperCase(),
      customerName: o.userId?.fullName || o.userId?.email || 'N/A',
      total: o.total,
      status: o.status,
      createdAt: o.createdAt
    }));
    res.json({ items, total, page: p, pages: Math.ceil(total / lim) });
  } catch (err) {
    next(err);
  }
});

// Update order status
router.patch('/orders/:id', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const allowed = ['pending', 'processing', 'shipping', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Users - return all
router.get('/users', async (req, res, next) => {
  try {
    const { q, page, limit = 8 } = req.query;
    const filter = {};
    if (q) filter.$or = [
      { fullName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ];

    const baseQuery = User.find(filter)
      .select('fullName email role createdAt')
      .lean();

    if (!page) {
      const users = await baseQuery;
      return res.json(users.map(u => ({
        id: u._id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      })));
    }

    const p = Math.max(1, Number(page));
    const lim = Math.max(1, Number(limit));
    const skip = (p - 1) * lim;
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      baseQuery.sort({ createdAt: -1 }).skip(skip).limit(lim)
    ]);
    const items = users.map(u => ({
      id: u._id,
      name: u.fullName,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.json({ items, total, page: p, pages: Math.ceil(total / lim) });
  } catch (err) {
    next(err);
  }
});

// Update user role
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!['admin', 'customer'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Banners - admin CRUD
router.get('/banners', async (req, res, next) => {
  try {
    const docs = await Banner.find({}).sort({ order: 1, createdAt: -1 }).lean();
    res.json(docs.map(b => ({
      id: b._id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      isActive: b.isActive,
      order: b.order,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      createdAt: b.createdAt
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/banners', async (req, res, next) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, isActive = true, order = 0, startsAt, endsAt } = req.body || {};
    if (!imageUrl) return res.status(400).json({ message: 'imageUrl is required' });
    const banner = await Banner.create({ title, subtitle, imageUrl, linkUrl, isActive, order, startsAt, endsAt });
    res.status(201).json(banner);
  } catch (err) {
    next(err);
  }
});

router.put('/banners/:id', async (req, res, next) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, isActive, order, startsAt, endsAt } = req.body || {};
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { title, subtitle, imageUrl, linkUrl, isActive, order, startsAt, endsAt },
      { new: true }
    );
    if (!banner) return res.status(404).json({ message: 'Not found' });
    res.json(banner);
  } catch (err) {
    next(err);
  }
});

router.delete('/banners/:id', async (req, res, next) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Order history with filters and pagination
router.get('/order-history', async (req, res, next) => {
  try {
    const { userId, productId, status, from, to, page = 1, limit = 8 } = req.query;
    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = userId;
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      filter['items.productId'] = new mongoose.Types.ObjectId(productId);
    }

    const p = Math.max(1, Number(page));
    const lim = Math.max(1, Number(limit));
    const skip = (p - 1) * lim;

    const baseQuery = Order.find(filter)
      .sort({ createdAt: -1 })
      .select('userId items total status createdAt')
      .populate('userId', 'fullName email')
      .populate('items.productId', 'name')
      .lean();

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      baseQuery.skip(skip).limit(lim)
    ]);

    const items = orders.map(o => ({
      id: o._id,
      user: { id: o.userId?._id, name: o.userId?.fullName, email: o.userId?.email },
      products: (o.items || []).map(it => ({ id: it.productId?._id || it.productId, name: it.productId?.name, qty: it.quantity, price: it.price })),
      total: o.total,
      status: o.status,
      createdAt: o.createdAt
    }));

    res.json({ items, total, page: p, pages: Math.ceil(total / lim) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
