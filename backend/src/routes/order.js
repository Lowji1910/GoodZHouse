const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

// POST /api/orders - Create a new order
router.post('/', authMiddleware, orderController.createOrder);

// GET /api/orders/status/:orderNumber - Get order status by order number (public)
router.get('/status/:orderNumber', orderController.getOrderStatus);

// GET /api/orders/:id - Get a single order by ID (user)
router.get('/:id', authMiddleware, orderController.getOrderById);

// GET /api/orders - Get all orders for the authenticated user
router.get('/', authMiddleware, orderController.getOrders);

// PUT /api/orders/:id - Update an order (admin)
router.put('/:id', authMiddleware, orderController.updateOrder);

module.exports = router;
