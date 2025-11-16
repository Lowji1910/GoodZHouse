const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

// Create order (authenticated)
router.post('/', requireAuth, async (req, res) => {
	try {
		const orderData = req.body;
		const order = new Order(orderData);
		await order.save();
		res.status(201).json(order);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Public: Get complete order status by order number (for public access via QR code)
router.get('/status/:orderNumber', async (req, res) => {
	try {
		const order = await Order.findOne({ orderNumber: req.params.orderNumber })
			.populate('items.productId', 'name price images')
			.lean();
		
		if (!order) {
			return res.status(404).json({ 
				error: 'Order not found',
				orderNumber: req.params.orderNumber 
			});
		}

		// Return public-safe information
		res.json({
			orderNumber: order.orderNumber,
			customerInfo: {
				name: order.customerInfo.name,
				email: order.customerInfo.email,
				phone: order.customerInfo.phone,
			},
			shippingAddress: order.shippingAddress,
			items: order.items.map(item => ({
				productId: item.productId._id,
				productName: item.productId.name,
				productImage: item.productId.images ? item.productId.images[0] : null,
				quantity: item.quantity,
				price: item.price,
				subtotal: item.price * item.quantity,
			})),
			total: order.total,
			discount: order.discount,
			subtotal: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
			status: order.status,
			paymentMethod: order.payment.method,
			paymentStatus: order.payment.status,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			statusTimeline: generateStatusTimeline(order),
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get single order by ID (authenticated - user's own order or admin)
router.get('/:id', requireAuth, async (req, res) => {
	try {
		const order = await Order.findById(req.params.id);
		if (!order) return res.status(404).json({ error: 'Order not found' });
		
		// Check authorization: user can only view their own order, admins can view all
		if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({ error: 'Unauthorized' });
		}
		
		res.json(order);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all orders for the authenticated user or all orders for admin
router.get('/', requireAuth, async (req, res) => {
	try {
		// If admin, fetch all orders; otherwise, fetch only user's orders
		const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
		const orders = await Order.find(query).sort({ createdAt: -1 });
		res.json(orders);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Generate order status timeline based on order status
 */
function generateStatusTimeline(order) {
	const statuses = ['pending', 'processing', 'shipped', 'delivered'];
	const currentIndex = statuses.indexOf(order.status);
	
	return statuses.map((status, index) => ({
		status,
		label: getStatusLabel(status),
		completed: index <= currentIndex,
		current: index === currentIndex,
		date: status === 'pending' ? order.createdAt : order.updatedAt,
	}));
}

/**
 * Get Vietnamese label for order status
 */
function getStatusLabel(status) {
	const labels = {
		pending: 'Chờ xác nhận',
		processing: 'Đang xử lý',
		shipped: 'Đã gửi',
		delivered: 'Đã giao',
		cancelled: 'Đã hủy',
	};
	return labels[status] || status;
}

module.exports = router;

// Update order by ID (authenticated/admin checks should be performed in middleware)
router.put('/:id', requireAuth, async (req, res) => {
	try {
		const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!updated) return res.status(404).json({ error: 'Order not found' });
		res.json(updated);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;
