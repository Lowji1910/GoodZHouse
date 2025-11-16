const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Get invoice template (Admin only)
// GET /api/invoices/template
router.get('/template', requireAuth, requireRole('admin'), invoiceController.getInvoiceTemplate);

// Save invoice template (Admin only)
// POST /api/invoices/template
router.post('/template', requireAuth, requireRole('admin'), invoiceController.saveInvoiceTemplate);

// Generate invoice PDF (Admin or order owner)
// GET /api/invoices/:orderId/print
router.get('/:orderId/print', requireAuth, invoiceController.generateInvoicePDF);

// Preview invoice in HTML (Admin or order owner)
// GET /api/invoices/:orderId/preview
router.get('/:orderId/preview', requireAuth, invoiceController.previewInvoice);

module.exports = router;
