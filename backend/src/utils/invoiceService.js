const puppeteer = require('puppeteer');
const Order = require('../models/Order');

/**
 * Invoice Service - Generates PDF invoices from HTML templates
 */
class InvoiceService {
  /**
   * Get invoice template from database
   */
  static async getTemplate() {
    try {
      const Setting = require('../models/Setting');
      const template = await Setting.findOne({ key: 'invoice_template' }).lean();
      return template?.value || this.getDefaultTemplate();
    } catch (error) {
      console.error('Error fetching invoice template:', error);
      return this.getDefaultTemplate();
    }
  }

  /**
   * Save invoice template to database
   */
  static async saveTemplate(htmlTemplate) {
    try {
      const Setting = require('../models/Setting');
      await Setting.findOneAndUpdate(
        { key: 'invoice_template' },
        { value: htmlTemplate },
        { upsert: true, new: true }
      );
      return { success: true };
    } catch (error) {
      console.error('Error saving invoice template:', error);
      throw error;
    }
  }

  /**
   * Generate PDF invoice for an order
   */
  static async generateInvoicePDF(orderId) {
    let browser;
    try {
      const order = await Order.findById(orderId)
        .populate('items.productId', 'name price')
        .lean();

      if (!order) {
        throw new Error('Order not found');
      }

      // Get template
      const template = await this.getTemplate();

      // Replace template variables
      const html = this.renderTemplate(template, order);

      // Generate PDF
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.createPage();
      await page.setContent(html, { waitUntil: 'networkidle2' });

      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });

      await browser.close();

      return pdf;
    } catch (error) {
      if (browser) await browser.close();
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Render template with order data
   */
  static renderTemplate(template, order) {
    let html = template;

    // Order information
    html = html.replace(/\{\{orderNumber\}\}/g, order.orderNumber);
    html = html.replace(/\{\{orderDate\}\}/g, new Date(order.createdAt).toLocaleDateString('vi-VN'));
    html = html.replace(/\{\{orderId\}\}/g, order._id.toString());

    // Customer information
    html = html.replace(/\{\{customerName\}\}/g, order.customerInfo.name);
    html = html.replace(/\{\{customerEmail\}\}/g, order.customerInfo.email);
    html = html.replace(/\{\{customerPhone\}\}/g, order.customerInfo.phone);

    // Shipping address
    html = html.replace(/\{\{shippingStreet\}\}/g, order.shippingAddress.street);
    html = html.replace(/\{\{shippingCity\}\}/g, order.shippingAddress.city);
    html = html.replace(/\{\{shippingPostalCode\}\}/g, order.shippingAddress.postalCode);
    html = html.replace(/\{\{shippingCountry\}\}/g, order.shippingAddress.country);

    // Items table
    const itemsHtml = order.items
      .map(item => `
        <tr>
          <td>${item.productId.name || item.productId}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${item.price.toLocaleString('vi-VN')}₫</td>
          <td style="text-align: right;">${(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
        </tr>
      `)
      .join('');

    html = html.replace(/\{\{items\}\}/g, itemsHtml);

    // Totals
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    html = html.replace(/\{\{subtotal\}\}/g, subtotal.toLocaleString('vi-VN'));
    html = html.replace(/\{\{discount\}\}/g, (order.discount || 0).toLocaleString('vi-VN'));
    html = html.replace(/\{\{total\}\}/g, order.total.toLocaleString('vi-VN'));

    // Payment information
    html = html.replace(/\{\{paymentMethod\}\}/g, this.getPaymentMethodLabel(order.payment.method));
    html = html.replace(/\{\{paymentStatus\}\}/g, this.getPaymentStatusLabel(order.payment.status));

    // Order status
    html = html.replace(/\{\{orderStatus\}\}/g, this.getOrderStatusLabel(order.status));

    return html;
  }

  /**
   * Get default invoice template
   */
  static getDefaultTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #667eea;
            font-size: 28px;
          }
          .company-name {
            color: #666;
            font-size: 14px;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 13px;
          }
          .detail-block h3 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 14px;
          }
          .detail-block p {
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .totals {
            margin-top: 20px;
            text-align: right;
            width: 100%;
          }
          .totals-row {
            display: flex;
            justify-content: flex-end;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
          }
          .totals-label {
            width: 150px;
            text-align: right;
            padding-right: 20px;
            font-weight: bold;
          }
          .totals-value {
            width: 150px;
            text-align: right;
          }
          .total-row {
            background: #f0f0f0;
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-pending { background: #fff3cd; color: #856404; }
          .status-processing { background: #cfe2ff; color: #084298; }
          .status-shipped { background: #d1e7dd; color: #0f5132; }
          .status-delivered { background: #d1e7dd; color: #0f5132; }
          .status-cancelled { background: #f8d7da; color: #842029; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HÓA ĐƠN</h1>
            <p class="company-name">GoodZHouse - Cửa hàng mua sắm trực tuyến</p>
          </div>

          <div class="invoice-details">
            <div class="detail-block">
              <h3>Thông tin hóa đơn</h3>
              <p><strong>Mã đơn hàng:</strong> {{orderNumber}}</p>
              <p><strong>Ngày:</strong> {{orderDate}}</p>
              <p><strong>Trạng thái:</strong> <span class="status-badge status-{{orderStatus}}">{{orderStatus}}</span></p>
            </div>

            <div class="detail-block">
              <h3>Thông tin khách hàng</h3>
              <p><strong>Tên:</strong> {{customerName}}</p>
              <p><strong>Email:</strong> {{customerEmail}}</p>
              <p><strong>Điện thoại:</strong> {{customerPhone}}</p>
            </div>

            <div class="detail-block">
              <h3>Địa chỉ giao hàng</h3>
              <p>{{shippingStreet}}</p>
              <p>{{shippingCity}}, {{shippingPostalCode}}</p>
              <p>{{shippingCountry}}</p>
            </div>
          </div>

          <h3 style="margin-top: 30px; color: #667eea;">Chi tiết sản phẩm</h3>
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th style="text-align: center; width: 100px;">Số lượng</th>
                <th style="text-align: right; width: 120px;">Đơn giá</th>
                <th style="text-align: right; width: 120px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {{items}}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <div class="totals-label">Tổng cộng:</div>
              <div class="totals-value">{{subtotal}}₫</div>
            </div>
            <div class="totals-row">
              <div class="totals-label">Giảm giá:</div>
              <div class="totals-value">-{{discount}}₫</div>
            </div>
            <div class="totals-row total-row">
              <div class="totals-label">Tổng thanh toán:</div>
              <div class="totals-value">{{total}}₫</div>
            </div>
          </div>

          <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
            <h4 style="margin-top: 0; color: #667eea;">Thông tin thanh toán</h4>
            <p><strong>Phương thức:</strong> {{paymentMethod}}</p>
            <p><strong>Trạng thái thanh toán:</strong> <span class="status-badge" style="background: {{paymentStatus === 'paid' ? '#d1e7dd' : '#fff3cd'}}; color: {{paymentStatus === 'paid' ? '#0f5132' : '#856404'}};">{{paymentStatus}}</span></p>
          </div>

          <div class="footer">
            <p>Cảm ơn bạn đã mua sắm tại GoodZHouse!</p>
            <p>&copy; 2025 GoodZHouse. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static getPaymentMethodLabel(method) {
    const labels = {
      momo: 'MoMo',
      vnpay: 'VNPay',
      cod: 'Thanh toán khi nhận hàng',
    };
    return labels[method] || method;
  }

  static getPaymentStatusLabel(status) {
    const labels = {
      paid: 'Đã thanh toán',
      unpaid: 'Chưa thanh toán',
    };
    return labels[status] || status;
  }

  static getOrderStatusLabel(status) {
    const labels = {
      pending: 'pending',
      processing: 'processing',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    return labels[status] || status;
  }
}

module.exports = InvoiceService;
