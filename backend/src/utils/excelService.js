const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Excel Service - Export and Import data
 */
class ExcelService {
  /**
   * Export products to Excel
   */
  static async exportProducts() {
    try {
      const products = await Product.find({}).lean();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      // Add headers
      worksheet.columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Slug', key: 'slug', width: 25 },
        { header: 'Short Description', key: 'shortDescription', width: 40 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Sale Price', key: 'salePrice', width: 12 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Category IDs', key: 'categoryIds', width: 30 },
        { header: 'Is Active', key: 'isActive', width: 12 },
        { header: 'Rating', key: 'rating', width: 10 },
        { header: 'Reviews Count', key: 'reviewsCount', width: 15 },
      ];

      // Add rows
      products.forEach(product => {
        worksheet.addRow({
          sku: product.sku || '',
          name: product.name || '',
          slug: product.slug || '',
          shortDescription: product.shortDescription || '',
          price: product.price || 0,
          salePrice: product.salePrice || '',
          stock: product.stock || 0,
          categoryIds: product.categoryIds ? product.categoryIds.join(',') : '',
          isActive: product.isActive !== false ? 'Yes' : 'No',
          rating: product.rating || 0,
          reviewsCount: product.reviewsCount || 0,
        });
      });

      // Style headers
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667eea' },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('Error exporting products:', error);
      throw error;
    }
  }

  /**
   * Export orders to Excel
   */
  static async exportOrders() {
    try {
      const orders = await Order.find({})
        .populate('userId', 'fullName email')
        .lean();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Orders');

      // Add headers
      worksheet.columns = [
        { header: 'Order Number', key: 'orderNumber', width: 15 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Items Count', key: 'itemsCount', width: 12 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Discount', key: 'discount', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Created Date', key: 'createdAt', width: 18 },
      ];

      // Add rows
      orders.forEach(order => {
        worksheet.addRow({
          orderNumber: order.orderNumber || '',
          customerName: order.customerInfo?.name || '',
          email: order.customerInfo?.email || '',
          phone: order.customerInfo?.phone || '',
          itemsCount: order.items?.length || 0,
          total: order.total || 0,
          discount: order.discount || 0,
          status: order.status || '',
          paymentMethod: order.payment?.method || '',
          paymentStatus: order.payment?.status || '',
          createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '',
        });
      });

      // Style headers
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667eea' },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('Error exporting orders:', error);
      throw error;
    }
  }

  /**
   * Import products from Excel file
   */
  static async importProducts(fileBuffer) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      const worksheet = workbook.getWorksheet(1);

      const products = [];
      let errors = [];
      let row = 2; // Start from row 2 (skip header)

      worksheet.eachRow((currentRow, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        try {
          const data = {
            sku: currentRow.getCell('A').value || null,
            name: currentRow.getCell('B').value,
            slug: currentRow.getCell('C').value,
            shortDescription: currentRow.getCell('D').value || '',
            price: Number(currentRow.getCell('E').value) || 0,
            salePrice: currentRow.getCell('F').value ? Number(currentRow.getCell('F').value) : null,
            stock: Number(currentRow.getCell('G').value) || 0,
            categoryIds: currentRow.getCell('H').value 
              ? String(currentRow.getCell('H').value).split(',').filter(id => id.trim()) 
              : [],
            isActive: String(currentRow.getCell('I').value).toLowerCase() === 'yes',
          };

          // Validate required fields
          if (!data.name) {
            errors.push({ row: rowNumber, error: 'Product name is required' });
            return;
          }

          if (data.price < 0) {
            errors.push({ row: rowNumber, error: 'Price must be greater than 0' });
            return;
          }

          products.push(data);
        } catch (error) {
          errors.push({ row: rowNumber, error: error.message });
        }
      });

      if (errors.length > 0) {
        return {
          success: false,
          message: 'Import failed due to validation errors',
          errors,
          productsImported: 0,
        };
      }

      // Insert products
      const result = await Product.insertMany(products, { ordered: false });

      return {
        success: true,
        message: `Successfully imported ${result.length} products`,
        productsImported: result.length,
      };
    } catch (error) {
      console.error('Error importing products:', error);
      throw error;
    }
  }

  /**
   * Generate product template for Excel import
   */
  static async generateProductTemplate() {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      worksheet.columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Slug', key: 'slug', width: 25 },
        { header: 'Short Description', key: 'shortDescription', width: 40 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Sale Price', key: 'salePrice', width: 12 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Category IDs', key: 'categoryIds', width: 30 },
        { header: 'Is Active', key: 'isActive', width: 12 },
      ];

      // Add example row
      worksheet.addRow({
        sku: 'PROD001',
        name: 'Example Product',
        slug: 'example-product',
        shortDescription: 'This is an example product',
        price: 100000,
        salePrice: 80000,
        stock: 50,
        categoryIds: 'categoryId1,categoryId2',
        isActive: 'Yes',
      });

      // Style headers
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667eea' },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('Error generating template:', error);
      throw error;
    }
  }
}

module.exports = ExcelService;
