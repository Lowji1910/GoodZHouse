const InvoiceService = require('../utils/invoiceService');
const Order = require('../models/Order');

/**
 * Get invoice template
 * @desc    GET /api/invoices/template
 * @access  Private/Admin
 */
const getInvoiceTemplate = async (req, res) => {
  try {
    const template = await InvoiceService.getTemplate();
    res.json({ html: template });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Save invoice template
 * @desc    POST /api/invoices/template
 * @access  Private/Admin
 */
const saveInvoiceTemplate = async (req, res) => {
  try {
    const { html } = req.body;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ message: 'HTML template is required' });
    }

    await InvoiceService.saveTemplate(html);
    res.json({ message: 'Template saved successfully', html });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Generate and download invoice PDF for an order
 * @desc    GET /api/invoices/:orderId/print
 * @access  Private/Admin
 */
const generateInvoicePDF = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verify order exists and user is admin or order owner
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Generate PDF
    const pdf = await InvoiceService.generateInvoicePDF(orderId);

    // Send PDF to client
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

/**
 * Preview invoice (HTML)
 * @desc    GET /api/invoices/:orderId/preview
 * @access  Private
 */
const previewInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verify order exists
    const order = await Order.findById(orderId)
      .populate('items.productId', 'name price')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get and render template
    const template = await InvoiceService.getTemplate();
    const html = InvoiceService.renderTemplate(template, order);

    res.contentType('text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: 'Failed to preview invoice', error: error.message });
  }
};

module.exports = {
  getInvoiceTemplate,
  saveInvoiceTemplate,
  generateInvoicePDF,
  previewInvoice,
};

