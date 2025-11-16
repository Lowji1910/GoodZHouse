const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');

// Create payment URL for VNPay
// POST /api/payment/create-payment-url
router.post('/create-payment-url', requireAuth, paymentController.createPaymentUrl);

// VNPay payment callback (Return endpoint)
// GET /api/payment/vnpay/callback
router.get('/vnpay/callback', paymentController.handleVNPayCallback);

// Get payment status
// GET /api/payment/status/:orderId
router.get('/status/:orderId', requireAuth, paymentController.getPaymentStatus);

module.exports = router;
