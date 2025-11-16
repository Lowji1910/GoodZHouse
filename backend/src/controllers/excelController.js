const ExcelService = require('../utils/excelService');

/**
 * Export products to Excel file
 * @desc    GET /api/admin/products/export
 * @access  Private/Admin
 */
const exportProducts = async (req, res) => {
  try {
    const buffer = await ExcelService.exportProducts();

    res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export products', error: error.message });
  }
};

/**
 * Export orders to Excel file
 * @desc    GET /api/admin/orders/export
 * @access  Private/Admin
 */
const exportOrders = async (req, res) => {
  try {
    const buffer = await ExcelService.exportOrders();

    res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export orders', error: error.message });
  }
};

/**
 * Import products from Excel file
 * @desc    POST /api/admin/products/import
 * @access  Private/Admin
 */
const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await ExcelService.importProducts(req.file.buffer);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Failed to import products', error: error.message });
  }
};

/**
 * Get product import template
 * @desc    GET /api/admin/products/import-template
 * @access  Private/Admin
 */
const getImportTemplate = async (req, res) => {
  try {
    const buffer = await ExcelService.generateProductTemplate();

    res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="products-template.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ message: 'Failed to generate template', error: error.message });
  }
};

module.exports = {
  exportProducts,
  exportOrders,
  importProducts,
  getImportTemplate,
};
