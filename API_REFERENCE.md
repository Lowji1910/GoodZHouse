# 🚀 GoodZHouse API Quick Reference

## Base URL
```
http://localhost:5000/api
```

---

## 📧 Email Service
- **Service**: Nodemailer with Gmail
- **Trigger**: Automatic on order confirmation
- **Includes**: QR code for order tracking

---

## 💳 Payment Gateway APIs

### Create Payment URL
```
POST /payment/create-payment-url
Content-Type: application/json
Authorization: Bearer {token}

{
  "orderId": "order_id",
  "paymentMethod": "vnpay" | "cod",
  "ipAddress": "127.0.0.1"
}

Response: {
  "success": true,
  "paymentUrl": "https://...",
  "transactionId": "transaction_id"
}
```

### VNPay Payment Callback
```
GET /payment/vnpay/callback?vnp_ResponseCode=00&vnp_TxnRef=order_id...
```
- **Access**: Public
- **Purpose**: Redirect from VNPay payment gateway
- **Returns**: Payment status

### Get Payment Status
```
GET /payment/status/:orderId
Authorization: Bearer {token}

Response: {
  "orderId": "order_id",
  "paymentMethod": "vnpay|cod",
  "paymentStatus": "paid|unpaid",
  "amount": 100000,
  "transactionId": "transaction_id"
}
```

---

## 📦 Order Management

### Get Order Status (Public)
```
GET /orders/status/:orderNumber
No authentication required

Response: {
  "orderNumber": "ABC123DEF",
  "customerInfo": { name, email, phone },
  "shippingAddress": { street, city, postalCode, country },
  "items": [{ productId, productName, quantity, price, subtotal }],
  "total": 100000,
  "discount": 10000,
  "status": "pending|processing|shipped|delivered|cancelled",
  "paymentMethod": "vnpay|cod",
  "paymentStatus": "paid|unpaid",
  "statusTimeline": [{ status, label, completed, current, date }]
}
```

### Get User's Orders
```
GET /orders
Authorization: Bearer {token}

Response: [{ id, userId, items, total, status, createdAt, updatedAt }]
```

### Create Order
```
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [{ productId, quantity, price }],
  "paymentMethod": "vnpay|cod",
  "shipping": { street, city, postalCode, country }
}
```

---

## 📄 Invoice Management

### Get Invoice Template
```
GET /invoices/template
Authorization: Bearer {admin_token}

Response: {
  "html": "<html>...{{variables}}...</html>"
}
```

### Save Custom Template
```
POST /invoices/template
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "html": "<html>...{{variables}}...</html>"
}
```

**Template Variables Available**:
- `{{orderNumber}}` - Order ID
- `{{orderDate}}` - Date
- `{{customerName}}`, `{{customerEmail}}`, `{{customerPhone}}`
- `{{items}}` - Product table (auto-filled)
- `{{subtotal}}`, `{{discount}}`, `{{total}}`
- `{{paymentMethod}}`, `{{paymentStatus}}`
- `{{orderStatus}}`
- Shipping address variables

### Generate Invoice PDF
```
GET /invoices/:orderId/print
Authorization: Bearer {token}

Returns: PDF file
```

### Preview Invoice (HTML)
```
GET /invoices/:orderId/preview
Authorization: Bearer {token}

Returns: HTML rendered invoice
```

---

## 📊 Excel Data Management

### Export Products to Excel
```
GET /admin/products/export
Authorization: Bearer {admin_token}

Returns: products.xlsx file
Includes: SKU, Name, Price, Stock, Categories, Rating
```

### Export Orders to Excel
```
GET /admin/orders/export
Authorization: Bearer {admin_token}

Returns: orders.xlsx file
Includes: Order Number, Customer, Items, Total, Status, Date
```

### Get Import Template
```
GET /admin/products/import-template
Authorization: Bearer {admin_token}

Returns: products-template.xlsx file
```

### Import Products from Excel
```
POST /admin/products/import
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

File: Excel file with products
Headers: SKU, Name, Slug, Description, Price, Sale Price, Stock, Categories, Is Active

Response: {
  "success": true|false,
  "message": "Successfully imported X products",
  "productsImported": X,
  "errors": [{ row, error }]
}
```

---

## ⚙️ Settings & Configuration

### Get Homepage Settings (Public)
```
GET /settings/homepage

Response: {
  "visibleCategories": ["cat_id1", "cat_id2"],
  "categoryOrder": ["cat_id1", "cat_id2"],
  "showFeaturedProducts": true,
  "showNewArrivals": true,
  "showSaleProducts": true,
  "itemsPerRow": 4,
  "itemsPerPage": 12
}
```

### Save Homepage Settings
```
POST /admin/settings/homepage
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "visibleCategories": ["cat_id1"],
  "categoryOrder": ["cat_id1"],
  "showFeaturedProducts": true,
  "showNewArrivals": true,
  "showSaleProducts": true,
  "itemsPerRow": 4,
  "itemsPerPage": 12
}
```

### Get All Settings
```
GET /admin/settings
Authorization: Bearer {admin_token}

Response: {
  "setting_key_1": setting_value_1,
  "setting_key_2": setting_value_2
}
```

### Get Available Categories
```
GET /admin/settings/categories
Authorization: Bearer {admin_token}

Response: [{ _id, name, slug, description }]
```

### Update Specific Setting
```
PUT /settings/:key
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "value": any_value
}
```

---

## 🖼️ Auth Page Images

### Get Auth Images (Public)
```
GET /settings/auth-images

Response: {
  "loginBackground": "/auth-images/login-xxx.jpg",
  "registerBackground": "/auth-images/register-xxx.jpg"
}
```

### Upload Login Background
```
POST /admin/settings/auth-images/login
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

File: image (jpg, png, gif, webp)
Max Size: 5MB

Response: {
  "message": "Login image uploaded successfully",
  "url": "/auth-images/login-xxx.jpg"
}
```

### Upload Register Background
```
POST /admin/settings/auth-images/register
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

File: image
Max Size: 5MB

Response: {
  "message": "Register image uploaded successfully",
  "url": "/auth-images/register-xxx.jpg"
}
```

### Delete Login Image
```
DELETE /admin/settings/auth-images/login
Authorization: Bearer {admin_token}

Response: {
  "message": "Login image deleted successfully"
}
```

### Delete Register Image
```
DELETE /admin/settings/auth-images/register
Authorization: Bearer {admin_token}

Response: {
  "message": "Register image deleted successfully"
}
```

---

## 🛒 Wishlist & Collections

### Get Wishlist
```
GET /wishlist
Authorization: Bearer {token}

Response: {
  "userId": "user_id",
  "collections": [
    {
      "name": "Collection Name",
      "description": "Description",
      "items": [{ productId, addedAt, priceAtAdd }],
      "isDefault": false,
      "isPublic": false
    }
  ],
  "allItems": ["product_id1", "product_id2"]
}
```

### Create Collection
```
POST /wishlist/collections
Authorization: Bearer {token}

{
  "name": "My Collection",
  "description": "Optional description",
  "isPublic": false
}
```

### Add to Collection
```
POST /wishlist/collections/:collectionId/items
Authorization: Bearer {token}

{
  "productId": "product_id",
  "notifyOnDiscount": false,
  "notifyThreshold": 50000
}
```

### Remove from Collection
```
DELETE /wishlist/collections/:collectionId/items/:productId
Authorization: Bearer {token}
```

---

## 🔐 Authentication Notes

- **Admin Token**: Required for all `/admin/*` endpoints
- **User Token**: Required for authenticated endpoints (users can only access their own data)
- **Public Endpoints**: No authentication required

---

## ⚡ Error Responses

### Standard Error Format
```json
{
  "message": "Error description",
  "error": "error details"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `403` - Forbidden (No permission)
- `404` - Not Found
- `500` - Server Error

---

## 📌 Important Notes

1. **Payment Methods**: MoMo, VNPay, COD (Cash on Delivery)
2. **Order Status Flow**: pending → processing → shipped → delivered
3. **File Uploads**: Images and Excel files via multipart/form-data
4. **Currency**: Vietnamese Dong (₫) - amounts in numbers only
5. **Timezone**: Vietnam (UTC+7)

---

## 🔧 Environment Variables Checklist

```
✅ MONGODB_URI
✅ PORT
✅ EMAIL_USER
✅ EMAIL_PASS
✅ FRONTEND_URL
✅ VNPAY_TMN_CODE (Sandbox)
✅ VNPAY_HASH_SECRET (Sandbox)
```

---

**Last Updated**: November 15, 2025  
**Version**: 1.0.0
