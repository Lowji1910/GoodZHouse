const Order = require('../models/Order');
// nanoid not used any more; using MongoDB _id as canonical orderNumber
const { sendOrderConfirmationEmail } = require('../utils/emailService');
// (previously used nanoid to create orderNumber)

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      customerInfo,
      shippingAddress,
      items,
      total,
      discount,
      couponCode,
      payment,
    } = req.body;

    const mongoose = require('mongoose');
    // Generate an ObjectId up-front and use it as canonical orderNumber
    const generatedId = new mongoose.Types.ObjectId();
    const order = new Order({
      _id: generatedId,
      orderNumber: generatedId.toString(),
      userId: req.user.id,
      customerInfo,
      shippingAddress,
      items,
      total,
      discount,
      couponCode,
      payment,
    });

    const createdOrder = await order.save();

    // Send order confirmation email (uses createdOrder.orderNumber)
    await sendOrderConfirmationEmail(createdOrder);

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get order status by order number
// @route   GET /api/orders/status/:orderNumber
// @access  Public
const getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });

    if (order) {
      res.json({
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
      });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order && (order.userId.toString() === req.user.id || req.user.isAdmin)) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrder = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status || order.status;
      if (paymentStatus) {
        order.payment.status = paymentStatus;
      }
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrderStatus,
  getOrderById,
  getOrders,
  updateOrder,
};
