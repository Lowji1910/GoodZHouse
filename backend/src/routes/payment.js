const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

// POST /api/payment/create-intent - Create a payment intent
router.post('/create-intent', authMiddleware, paymentController.createPaymentIntent);

// POST /api/payment/webhook - Handle payment webhook
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
