const Order = require('../models/Order');
const { VNPayPayment } = require('../utils/paymentService');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// Initialize payment services
const vnpayPayment = new VNPayPayment();

/**
 * Create payment intent for MoMo or VNPay
 * @desc    POST /api/payment/create-payment-url
 * @access  Private
 */
const createPaymentUrl = async (req, res) => {
  try {
    const { orderId, paymentMethod, ipAddress } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ message: 'orderId and paymentMethod are required' });
    }

    // Find order
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate payment method
    if (!['vnpay', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // COD doesn't need payment URL
    if (paymentMethod === 'cod') {
      return res.json({ success: true, message: 'COD selected', paymentUrl: null });
    }

    // Prepare order data
    const paymentData = {
      orderId: order._id.toString(),
      total: order.total,
      customerEmail: order.customerInfo.email,
      customerPhone: order.customerInfo.phone,
      ipAddress: ipAddress || '127.0.0.1',
    };

    if (paymentMethod === 'vnpay') {
      const paymentUrl = vnpayPayment.createPaymentUrl(paymentData);

      // Extract transaction ref from URL params
      const urlObj = new URL(paymentUrl);
      const txnRef = urlObj.searchParams.get('vnp_TxnRef');

      // Update order with VNPay transaction info
      await Order.findByIdAndUpdate(orderId, {
        'payment.method': 'vnpay',
        'payment.transactionId': txnRef,
      });

      return res.json({
        success: true,
        paymentUrl,
        transactionId: txnRef,
      });
    }
  } catch (error) {
    console.error('Payment URL Creation Error:', error);
    res.status(500).json({ message: 'Payment URL creation failed', error: error.message });
  }
};

/**
 * Handle VNPay payment callback
 * @desc    GET /api/payment/vnpay/callback
 * @access  Public
 */
const handleVNPayCallback = async (req, res) => {
  try {
    const queryData = req.query;

    // Verify signature
    if (!vnpayPayment.verifyCallback(queryData)) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Process callback
    const result = vnpayPayment.processCallback(queryData);

    if (result.success) {
      // Update order status
      await Order.findByIdAndUpdate(result.orderId, {
        'payment.status': 'paid',
        'payment.transactionId': result.transactionId,
        status: 'processing',
      });

      // Send confirmation email
      const order = await Order.findById(result.orderId);
      if (order) {
        await sendOrderConfirmationEmail(order);
      }

      res.json({ success: true, message: 'Payment verified' });
    } else {
      // Payment failed
      await Order.findByIdAndUpdate(result.orderId, {
        'payment.status': 'unpaid',
        status: 'cancelled',
      });

      res.status(400).json(result);
    }
  } catch (error) {
    console.error('VNPay Callback Error:', error);
    res.status(500).json({ message: 'Callback processing failed', error: error.message });
  }
};

/**
 * Get payment status
 * @desc    GET /api/payment/status/:orderId
 * @access  Private
 */
const getPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderId: order._id,
      paymentMethod: order.payment.method,
      paymentStatus: order.payment.status,
      amount: order.total,
      transactionId: order.payment.transactionId,
    });
  } catch (error) {
    console.error('Payment Status Error:', error);
    res.status(500).json({ message: 'Failed to fetch payment status', error: error.message });
  }
};

module.exports = {
  createPaymentUrl,
  handleVNPayCallback,
  getPaymentStatus,
};

