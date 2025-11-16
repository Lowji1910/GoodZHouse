const nodemailer = require('nodemailer');
const qrcode = require('qrcode');

let transporter = null;
let usingEthereal = false;

const createTransporterIfNeeded = async () => {
  if (transporter) return transporter;

  // Prefer Brevo (Sendinblue) SMTP if set
  if (process.env.EMAIL_USER_BREVO && process.env.EMAIL_PASS_BREVO) {
    if (process.env.FORCE_ETHEREAL === 'true') {
      console.warn('FORCE_ETHEREAL=true — skipping configured Brevo SMTP and creating Ethereal test account.');
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST_BREVO || 'smtp-relay.brevo.com',
        port: parseInt(process.env.EMAIL_PORT_BREVO || '587', 10),
        secure: (process.env.EMAIL_PORT_BREVO === '465'),
        auth: {
          user: process.env.EMAIL_USER_BREVO,
          pass: process.env.EMAIL_PASS_BREVO,
        },
      });
      usingEthereal = false;
      console.log('Email transporter configured: using Brevo SMTP', process.env.EMAIL_HOST_BREVO || 'smtp-relay.brevo.com');
      return transporter;
    }
  }

  // Fallback to old EMAIL_USER / EMAIL_PASS (Gmail or other provider)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // If developer explicitly wants Ethereal preview, allow forcing it
    if (process.env.FORCE_ETHEREAL === 'true') {
      console.warn('FORCE_ETHEREAL=true — skipping configured SMTP and creating Ethereal test account.');
    } else {
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      usingEthereal = false;
      console.log('Email transporter configured: using SMTP service', process.env.EMAIL_SERVICE || 'gmail');
      return transporter;
    }
  }

  // No SMTP configured: create Ethereal test account for development
  try {
    console.warn('EMAIL_USER/PASS not set — creating Ethereal test account for email preview.');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingEthereal = true;
    return transporter;
  } catch (err) {
    console.warn('Failed to create Ethereal account, emails will be skipped:', err && err.message ? err.message : err);
    transporter = null;
    usingEthereal = false;
    return null;
  }
};

/**
 * Send order confirmation email with QR code
 * @param {Object} order - Order document
 */
const sendOrderConfirmationEmail = async (order) => {
  try {
    // Generate QR code buffer (attach as inline image with CID so email clients show it reliably)
    // Use the order detail URL (frontend route '/orders/:orderId') so the link in
    // the email matches the order detail page on the website.
    const orderStatusUrl = `${process.env.FRONTEND_URL}/orders/${order._id || order.id || order.orderNumber}`;
    const qrCodeBuffer = await qrcode.toBuffer(orderStatusUrl);

    // Format items list
    const itemsHtml = order.items
      .map(item => `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productId}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.price.toLocaleString('vi-VN')}₫</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
      </tr>`)
      .join('');

    // Discount and total
    const discountHtml = order.discount > 0 
      ? `<tr>
          <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Giảm giá:</td>
          <td style="padding: 8px; text-align: right;">-${order.discount.toLocaleString('vi-VN')}₫</td>
        </tr>`
      : '';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER_BREVO || process.env.EMAIL_USER,
      to: order.customerInfo.email,
      subject: `Xác nhận đơn hàng #${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { border: 1px solid #ddd; border-top: none; padding: 20px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #667eea; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th { background: #f5f5f5; padding: 10px; text-align: left; font-weight: bold; }
            .qr-section { text-align: center; margin: 20px 0; }
            .qr-section img { width: 150px; height: 150px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cảm ơn đã đặt hàng!</h1>
              <p>GoodZHouse - Mua sắm thông minh</p>
            </div>
            
            <div class="content">
              <div class="section">
                <p>Xin chào <strong>${order.customerInfo.name}</strong>,</p>
                <p>Chúng tôi đã nhận được đơn hàng của bạn. Chi tiết đơn hàng như sau:</p>
              </div>

              <div class="section">
                <div class="label">Mã đơn hàng:</div>
                <p><strong>#${order.orderNumber}</strong></p>
              </div>

              <div class="section">
                <div class="label">Thông tin giao hàng:</div>
                <p>
                  ${order.customerInfo.name}<br>
                  Điện thoại: ${order.customerInfo.phone}<br>
                  Địa chỉ: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.country}
                </p>
              </div>

              <div class="section">
                <div class="label">Chi tiết đơn hàng:</div>
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                    ${discountHtml}
                    <tr style="background: #f9f9f9;">
                      <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Tổng cộng:</td>
                      <td style="padding: 8px; text-align: right; font-size: 18px; color: #667eea; font-weight: bold;">${order.total.toLocaleString('vi-VN')}₫</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="section">
                <div class="label">Phương thức thanh toán:</div>
                <p>${order.payment.method === 'cod' ? 'Thanh toán khi nhận hàng' : order.payment.method.toUpperCase()}</p>
              </div>

              <div class="qr-section">
                <p><strong>Quét mã QR để xem trạng thái đơn hàng:</strong></p>
                <img src="cid:order_qr" alt="Order Status QR Code" style="width:150px;height:150px;">
              </div>

              <div style="text-align: center;">
                <a href="${orderStatusUrl}" class="button">Xem trạng thái đơn hàng</a>
              </div>

              <div class="section" style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">
                <p style="font-size: 12px; color: #666;">
                  Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.<br>
                  Cảm ơn bạn đã mua sắm tại GoodZHouse!
                </p>
              </div>
            </div>

            <div class="footer">
              <p>&copy; 2025 GoodZHouse. Tất cả các quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const t = await createTransporterIfNeeded();
    if (!t) {
      console.warn('Skipping sendOrderConfirmationEmail because transporter could not be created.');
      return { success: false, error: 'Email transporter not configured' };
    }

    let info;
    try {
      // attach QR image as inline attachment
      const mailOptionsWithAttachments = Object.assign({}, mailOptions, {
        attachments: [
          {
            filename: 'order_qr.png',
            content: qrCodeBuffer,
            cid: 'order_qr',
          },
        ],
      });

      info = await t.sendMail(mailOptionsWithAttachments);
      console.log(`Order confirmation email queued to: ${order.customerInfo.email}`);
    } catch (err) {
      console.error('Error sending email with configured transporter:', err && err.message ? err.message : err);
      // If authentication failed (bad credentials), try Ethereal fallback so dev can preview
      const isAuthError = err && (err.code === 'EAUTH' || err.responseCode === 535 || /auth/i.test(err.message || ''));
      if (isAuthError) {
        try {
          console.warn('SMTP auth failed — creating Ethereal test account and retrying send...');
          const testAccount = await nodemailer.createTestAccount();
          const ethTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: { user: testAccount.user, pass: testAccount.pass },
          });
          info = await ethTransporter.sendMail(mailOptions);
          const preview = nodemailer.getTestMessageUrl(info);
          console.log('Ethereal preview URL:', preview);
          return { success: true, message: 'Email sent (ethereal fallback)', previewUrl: preview };
        } catch (ethErr) {
          console.error('Failed to send via Ethereal fallback:', ethErr && ethErr.message ? ethErr.message : ethErr);
          return { success: false, error: ethErr && ethErr.message ? ethErr.message : ethErr };
        }
      }

      return { success: false, error: err && err.message ? err.message : err };
    }

    if (usingEthereal) {
      const preview = nodemailer.getTestMessageUrl(info);
      console.log('Ethereal preview URL:', preview);
      return { success: true, message: 'Email sent (ethereal)', previewUrl: preview };
    }
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send generic email
 * @param {Object} options - Email options { to, subject, text, html }
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER_BREVO || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const t = await createTransporterIfNeeded();
    if (!t) {
      console.warn('Skipping sendEmail because transporter could not be created.');
      return { success: false, error: 'Email transporter not configured' };
    }

    try {
      const info = await t.sendMail(mailOptions);
      if (usingEthereal) {
        const preview = nodemailer.getTestMessageUrl(info);
        console.log('Ethereal preview URL:', preview);
        return { success: true, message: 'Email sent (ethereal)', previewUrl: preview };
      }
      return { success: true, message: 'Email sent successfully' };
    } catch (err) {
      console.error('Error sending email with configured transporter:', err && err.message ? err.message : err);
      const isAuthError = err && (err.code === 'EAUTH' || err.responseCode === 535 || /auth/i.test(err.message || ''));
      if (isAuthError) {
        try {
          console.warn('SMTP auth failed — creating Ethereal test account and retrying send...');
          const testAccount = await nodemailer.createTestAccount();
          const ethTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: { user: testAccount.user, pass: testAccount.pass },
          });
          const info = await ethTransporter.sendMail(mailOptions);
          const preview = nodemailer.getTestMessageUrl(info);
          console.log('Ethereal preview URL:', preview);
          return { success: true, message: 'Email sent (ethereal fallback)', previewUrl: preview };
        } catch (ethErr) {
          console.error('Failed to send via Ethereal fallback:', ethErr && ethErr.message ? ethErr.message : ethErr);
          return { success: false, error: ethErr && ethErr.message ? ethErr.message : ethErr };
        }
      }

      return { success: false, error: err && err.message ? err.message : err };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendEmail,
};

