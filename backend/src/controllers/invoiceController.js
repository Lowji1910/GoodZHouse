const puppeteer = require('puppeteer');
const Setting = require('../models/Setting');
const Order = require('../models/Order');

// @desc    Get invoice template
// @route   GET /api/invoices/template
// @access  Private/Admin
const getInvoiceTemplate = async (req, res) => {
  try {
    const template = await Setting.findOne({ key: 'invoiceTemplate' });
    res.json(template ? template.value : { html: '' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update invoice template
// @route   PUT /api/invoices/template
// @access  Private/Admin
const updateInvoiceTemplate = async (req, res) => {
  try {
    const { html } = req.body;
    await Setting.findOneAndUpdate(
      { key: 'invoiceTemplate' },
      { value: { html } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Generate and download an invoice PDF
// @route   GET /api/invoices/:orderId
// @access  Private/Admin
const generateInvoicePDF = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('items.productId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const templateSetting = await Setting.findOne({ key: 'invoiceTemplate' });
    let html = templateSetting ? templateSetting.value.html : '<h1>Invoice for Order #{{orderNumber}}</h1>';

    // Replace placeholders
    html = html.replace(/{{orderNumber}}/g, order.orderNumber);
    html = html.replace(/{{customerName}}/g, order.customerInfo.name);
    html = html.replace(/{{customerEmail}}/g, order.customerInfo.email);
    html = html.replace(/{{total}}/g, order.total.toLocaleString('vi-VN'));
    // ... add more placeholders as needed

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.contentType('application/pdf');
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getInvoiceTemplate,
  updateInvoiceTemplate,
  generateInvoicePDF,
};
