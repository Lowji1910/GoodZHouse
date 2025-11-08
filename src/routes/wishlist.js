const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { Types: { ObjectId } } = require('mongoose');
const { requireAuth } = require('../middleware/auth');

// Get user's wishlist
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  let wishlist = await Wishlist.findOne({ userId })
    .populate('collections.items.productId', 'name price images');
  
  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      collections: [{
        name: 'Danh sách yêu thích',
        isDefault: true,
        items: []
      }]
    });
  }
  
  res.json(wishlist);
});

// Create new collection
router.post('/collections', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { name, description, isPublic } = req.body;
  
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });
  
  wishlist.collections.push({
    name,
    description,
    isPublic,
    items: []
  });
  
  await wishlist.save();
  res.status(201).json(wishlist.collections[wishlist.collections.length - 1]);
});

// Update collection
router.put('/collections/:collectionId', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { name, description, isPublic } = req.body;
  
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });
  
  const collection = wishlist.collections.id(req.params.collectionId);
  if (!collection) return res.status(404).json({ message: 'Collection not found' });
  
  Object.assign(collection, { name, description, isPublic });
  await wishlist.save();
  res.json(collection);
});

// Add item to collection
router.post('/collections/:collectionId/items', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { productId, notifyOnDiscount, notifyThreshold } = req.body;
  
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });
  
  const collection = wishlist.collections.id(req.params.collectionId);
  if (!collection) return res.status(404).json({ message: 'Collection not found' });
  
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  
  // Check if item already exists in any collection
  if (wishlist.allItems.includes(productId)) {
    return res.status(400).json({ message: 'Product already in wishlist' });
  }
  
  collection.items.push({
    productId,
    priceAtAdd: product.price,
    notifyOnDiscount,
    notifyThreshold
  });
  
  await wishlist.save();
  res.status(201).json(collection);
});

// Remove item from collection
router.delete('/collections/:collectionId/items/:productId', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });
  
  const collection = wishlist.collections.id(req.params.collectionId);
  if (!collection) return res.status(404).json({ message: 'Collection not found' });
  
  collection.items = collection.items.filter(
    item => item.productId.toString() !== req.params.productId
  );
  
  await wishlist.save();
  res.status(204).send();
});

// Generate share token
router.post('/collections/:collectionId/share', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });
  
  const collection = wishlist.collections.id(req.params.collectionId);
  if (!collection) return res.status(404).json({ message: 'Collection not found' });
  
  collection.isPublic = true;
  collection.shareToken = ObjectId().toString();
  
  await wishlist.save();
  res.json({ shareToken: collection.shareToken });
});

// View shared collection
router.get('/shared/:token', async (req, res) => {
  const wishlist = await Wishlist.findOne({
    'collections.shareToken': req.params.token,
    'collections.isPublic': true
  }).populate('collections.items.productId', 'name price images');
  
  if (!wishlist) return res.status(404).json({ message: 'Shared wishlist not found' });
  
  const collection = wishlist.collections.find(c => c.shareToken === req.params.token);
  res.json(collection);
});

// Add multiple items to cart
router.post('/collections/:collectionId/add-to-cart', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });
  
  const collection = wishlist.collections.id(req.params.collectionId);
  if (!collection) return res.status(404).json({ message: 'Collection not found' });
  
  // Get current product info
  const productIds = collection.items.map(item => item.productId);
  const products = await Product.find({
    _id: { $in: productIds }
  }).select('_id price stock');
  
  // Create cart items
  const cartItems = products
    .filter(p => p.stock > 0)
    .map(p => ({
      productId: p._id,
      quantity: 1,
      priceAtAdd: p.price
    }));
  
  // TODO: Add to cart logic here
  
  res.json({ addedItems: cartItems.length });
});

module.exports = router;