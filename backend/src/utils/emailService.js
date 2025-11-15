const nodemailer = require('nodemailer');
const qrcode = require('qrcode');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or another email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password
  },
});

const sendOrderConfirmationEmail = async (order) => {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(
      `${process.env.FRONTEND_URL}/orders/status/${order.orderNumber}`
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: order.customerInfo.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Your order number is: <strong>${order.orderNumber}</strong></p>
        <p>You can track your order status using the QR code below or by visiting the link.</p>
        <img src="${qrCodeDataUrl}" alt="Order Status QR Code" />
        <p>
          <a href="${process.env.FRONTEND_URL}/orders/status/${order.orderNumber}">
            View Order Status
          </a>
        </p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', order.customerInfo.email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendOrderConfirmationEmail,
};
