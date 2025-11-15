const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin'); // Assuming you have an admin middleware

// GET /api/invoices/template - Get the invoice template
router.get('/template', authMiddleware, adminMiddleware, invoiceController.getInvoiceTemplate);

// PUT /api/invoices/template - Update the invoice template
router.put('/template', authMiddleware, adminMiddleware, invoiceController.updateInvoiceTemplate);

// GET /api/invoices/:orderId - Generate a PDF invoice for an order
router.get('/:orderId', authMiddleware, adminMiddleware, invoiceController.generateInvoicePDF);

module.exports = router;
