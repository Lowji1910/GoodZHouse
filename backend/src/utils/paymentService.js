const crypto = require('crypto');

/**
 * VNPay Payment Gateway Integration
 * Sandbox URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 */
class VNPayPayment {
  constructor() {
    this.tmnCode = process.env.VNPAY_TMN_CODE || '';
    this.hashSecret = process.env.VNPAY_HASH_SECRET || '';
    this.endpoint = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  }

  /**
   * Create VNPay payment URL
   * @param {Object} order - Order data { orderId, total, customerEmail, customerPhone, ipAddress }
   * @returns {String} - Payment URL
   */
  createPaymentUrl(order) {
    try {
      const { orderId, total, ipAddress = '127.0.0.1' } = order;

      const tmnCode = this.tmnCode;
      const secretKey = this.hashSecret;
      const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
      const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback/vnpay`;

      const date = new Date();
      const createDate = date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0') +
        String(date.getHours()).padStart(2, '0') +
        String(date.getMinutes()).padStart(2, '0') +
        String(date.getSeconds()).padStart(2, '0');

      const amount = Math.floor(total * 100); // VNPay requires amount in hundredths

      const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vi',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: String(orderId),
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Amount: amount,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddress,
        vnp_CreateDate: createDate,
      };

      // Sort parameters
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((result, key) => {
          result[key] = params[key];
          return result;
        }, {});

      // Create signature
      const signData = Object.keys(sortedParams)
        .map(key => `${key}=${sortedParams[key]}`)
        .join('&');

      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // Build payment URL
      const paymentUrl = new URL(vnpUrl);
      Object.entries(sortedParams).forEach(([key, value]) => {
        paymentUrl.searchParams.append(key, value);
      });
      paymentUrl.searchParams.append('vnp_SecureHash', signed);

      return paymentUrl.toString();
    } catch (error) {
      console.error('VNPay Payment URL Error:', error);
      throw new Error(`VNPay payment URL creation failed: ${error.message}`);
    }
  }

  /**
   * Verify VNPay payment callback signature
   * @param {Object} queryData - Query parameters from VNPay callback
   * @returns {Boolean} - True if signature is valid
   */
  verifyCallback(queryData) {
    try {
      const secretKey = this.hashSecret;
      const { vnp_SecureHash, ...params } = queryData;

      const signData = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

      const hmac = crypto.createHmac('sha512', secretKey);
      const computed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      return vnp_SecureHash === computed;
    } catch (error) {
      console.error('VNPay Signature Verification Error:', error);
      return false;
    }
  }

  /**
   * Process VNPay callback response
   * @param {Object} queryData - Query parameters from VNPay
   * @returns {Object} - { success: boolean, message: string, transactionId: string }
   */
  processCallback(queryData) {
    try {
      const { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo } = queryData;

      if (vnp_ResponseCode === '00') {
        return {
          success: true,
          message: 'Payment successful',
          transactionId: vnp_TransactionNo,
          orderId: vnp_TxnRef,
        };
      } else {
        return {
          success: false,
          message: `Payment failed with code: ${vnp_ResponseCode}`,
          code: vnp_ResponseCode,
        };
      }
    } catch (error) {
      console.error('VNPay Callback Processing Error:', error);
      return {
        success: false,
        message: 'Error processing callback',
      };
    }
  }
}

module.exports = {
  VNPayPayment,
};
