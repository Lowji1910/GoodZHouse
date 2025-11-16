# 🚀 GoodZHouse - Hướng Dẫn Cài Đặt & Kiểm Thử

## 📋 Yêu Cầu Cần Thiết

Trước khi bắt đầu, hãy đảm bảo bạn có:
- Node.js (v14+) đã được cài đặt
- MongoDB (v4.4+) đang chạy trên máy cục bộ hoặc kết nối Atlas
- Git đã được cài đặt
- Tài khoản Gmail với App Password được kích hoạt
- Tài khoản sandbox cổng thanh toán (MoMo & VNPay) - Tùy chọn để kiểm thử

---

## 🔧 Cài Đặt Backend

### Bước 1: Cài Đặt Các Gói Phụ Thuộc

```bash
cd backend
npm install
```

**Các gói mới được cài đặt**:
- `axios` - HTTP client cho các yêu cầu đến cổng thanh toán
- `exceljs` - Tạo và phân tích tệp Excel
- `multer` - Xử lý tải tệp lên

### Bước 2: Cấu Hình Biến Môi Trường

Chỉnh sửa tệp `backend/.env`:

```env
# Cơ Sở Dữ Liệu
MONGODB_URI=mongodb://localhost:27017/goodzhouse
PORT=5000

# Cấu Hình Email (Gmail)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:3000

# Cổng Thanh Toán - MoMo Sandbox
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_PARTNER_CODE=your_momo_partner_code

# Cổng Thanh Toán - VNPay Sandbox
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

### Bước 3: Tạo Thư Mục Cần Thiết

```bash
mkdir -p backend/public/auth-images
```

### Bước 4: Khởi Động MongoDB

```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Bước 5: Khởi Động Máy Chủ Backend

```bash
# Phát triển (tự động tải lại)
npm run dev

# Sản xuất
npm start
```

**Kết quả dự kiến**:
```
Server running on port 5000
```

---

## 🎨 Cài Đặt Frontend

### Bước 1: Cài Đặt Các Gói Phụ Thuộc

```bash
npm install
```

### Bước 2: Cấu Hình URL Cơ Sở API

Chỉnh sửa `src/services/api.js`:

```javascript
const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
```

### Bước 3: Khởi Động Frontend

```bash
npm start
```

**Kết quả dự kiến**:
```
Compiled successfully!
You can now view goodzhouse in the browser.
  Local:   http://localhost:3000
```

---

## 🧪 Danh Sách Kiểm Tra Kiểm Thử

### Dịch Vụ Email ✅
- [ ] Tạo một đơn hàng
- [ ] Xác minh email xác nhận đã được gửi
- [ ] Kiểm tra email có chứa mã QR
- [ ] Kiểm tra email có thông tin đơn hàng chính xác
- [ ] Liên kết mã QR đến trang trạng thái đơn hàng chính xác

### Trang Trạng Thái Đơn Hàng ✅
- [ ] Truy cập `/orders/status/:orderNumber` mà không cần đăng nhập
- [ ] Xác minh chi tiết đơn hàng hiển thị chính xác
- [ ] Quét mã QR từ email
- [ ] Kiểm tra dòng thời gian trạng thái cho biết giai đoạn chính xác
- [ ] Xác minh thông tin khách hàng được ẩn thích hợp

### Bộ Sưu Tập Danh Sách Yêu Thích ✅
- [ ] Tạo một bộ sưu tập mới
- [ ] Thêm sản phẩm vào bộ sưu tập
- [ ] Xóa sản phẩm khỏi bộ sưu tập
- [ ] Chỉnh sửa tên bộ sưu tập
- [ ] Công khai/Riêng tư bộ sưu tập
- [ ] Chia sẻ liên kết bộ sưu tập

### Xử Lý Thanh Toán ✅
- [ ] Nhấp vào nút "Thanh Toán bằng MoMo"
- [ ] Nhấp vào nút "Thanh Toán bằng VNPay"
- [ ] Chọn tùy chọn "COD"
- [ ] Xác minh trạng thái đơn hàng thay đổi sau khi thanh toán
- [ ] Xác minh cập nhật trạng thái thanh toán

### Tạo Hóa Đơn ✅
- [ ] Truy cập trình chỉnh sửa mẫu hóa đơn (Quản trị viên)
- [ ] Lưu mẫu HTML tùy chỉnh
- [ ] Tạo PDF hóa đơn từ đơn hàng
- [ ] Xem trước hóa đơn trong HTML
- [ ] In hóa đơn trực tiếp
- [ ] Xác minh tất cả trình giữ chỗ được thay thế chính xác

### Các Hoạt Động Excel ✅
- [ ] Tải mẫu nhập sản phẩm
- [ ] Tạo tệp Excel mẫu
- [ ] Nhập sản phẩm từ Excel
- [ ] Xác minh các lỗi xác thực hoạt động
- [ ] Xuất tất cả sản phẩm sang Excel
- [ ] Xuất tất cả đơn hàng sang Excel
- [ ] Mở tệp Excel trong ứng dụng bảng tính

### Cài Đặt Trang Chủ ✅
- [ ] Truy cập trang cài đặt trang chủ (Quản trị viên)
- [ ] Chọn danh mục hiển thị
- [ ] Sắp xếp lại danh mục
- [ ] Bật/tắt sản phẩm nổi bật
- [ ] Bật/tắt sản phẩm mới
- [ ] Bật/tắt sản phẩm giảm giá
- [ ] Lưu cài đặt
- [ ] Làm mới trang chủ và xác minh thay đổi

### Hình Ảnh Trang Xác Thực ✅
- [ ] Tải lên hình nền trang đăng nhập
- [ ] Tải lên hình nền trang đăng ký
- [ ] Xác minh hình ảnh hiển thị trên các trang đăng nhập/đăng ký
- [ ] Xóa hình ảnh đăng nhập
- [ ] Xóa hình ảnh đăng ký
- [ ] Xác minh dự phòng khi hình ảnh bị xóa

### Cải Tiến Giao Diện / Trải Nghiệm Người Dùng ✅
- [ ] Kiểm tra phông chữ Segoe UI được áp dụng
- [ ] Kiểm tra hoạt ảnh di chuột của nút
- [ ] Kiểm tra hiệu ứng di chuột của thẻ
- [ ] Kiểm tra hiệu ứng phóng to của thẻ sản phẩm
- [ ] Kiểm tra trạng thái lấy tiêu điểm biểu mẫu
- [ ] Kiểm tra thiết kế đáp ứng trên thiết bị di động
- [ ] Kiểm tra hoạt ảnh navbar
- [ ] Xác minh cuộn mịn
- [ ] Kiểm tra kiểu thanh cuộn tùy chỉnh

---

## 📝 Kiểm Thử API bằng Postman/Curl

### Kiểm Thử Tạo Thanh Toán

```bash
curl -X POST http://localhost:5000/api/payment/create-payment-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_123",
    "paymentMethod": "momo",
    "ipAddress": "127.0.0.1"
  }'
```

### Kiểm Thử Trạng Thái Đơn Hàng

```bash
curl http://localhost:5000/api/orders/status/ABC123DEF
```

### Kiểm Thử Tạo Hóa Đơn

```bash
curl -X GET http://localhost:5000/api/invoices/ORDER_ID/print \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o invoice.pdf
```

### Kiểm Thử Xuất Excel

```bash
curl http://localhost:5000/api/admin/products/export \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o products.xlsx
```

---

## 🐛 Khắc Phục Sự Cố

### Email Không Được Gửi

**Vấn đề**: "Error: Invalid login credentials"

**Giải pháp**:
1. Bật "Ứng dụng kém an toàn" trong cài đặt Gmail
2. Hoặc sử dụng App Password thay vì mật khẩu thông thường
3. Kiểm tra EMAIL_USER và EMAIL_PASS trong .env

### Tạo PDF Không Thành Công

**Vấn đề**: "Puppeteer launch error"

**Giải pháp**:
```bash
# Windows
npm install --save-dev @types/puppeteer

# Linux có thể cần các phụ thuộc bổ sung
sudo apt-get install libx11-xcb1 libxcb1
```

### Cổng Thanh Toán Không Hoạt Động

**Vấn đề**: "Error connecting to payment service"

**Giải pháp**:
1. Xác minh thông tin xác thực sandbox chính xác
2. Kiểm tra MOMO_ACCESS_KEY, VNPAY_TMN_CODE trong .env
3. Kiểm tra với postman trước
4. Kiểm tra các trang trạng thái cổng thanh toán

### Kết Nối MongoDB Không Thành Công

**Vấn đề**: "connect ECONNREFUSED 127.0.0.1:27017"

**Giải pháp**:
```bash
# Khởi động dịch vụ MongoDB
mongod

# Hoặc kiểm tra xem đã chạy chưa
sudo systemctl status mongod
```

### Nhập Excel Không Hoạt Động

**Vấn đề**: "No file uploaded"

**Giải pháp**:
- Kiểm tra Content-Type là multipart/form-data
- Xác minh tệp tồn tại và là định dạng Excel hợp lệ
- Kiểm tra kích thước tệp hợp lý

---

## 📊 Dữ Liệu Kiểm Thử Mẫu

### Tạo Đơn Hàng Kiểm Thử

```javascript
// Sử dụng API
const order = {
  items: [
    { productId: "PROD_001", quantity: 2, price: 100000 },
    { productId: "PROD_002", quantity: 1, price: 250000 }
  ],
  paymentMethod: "cod",
  shipping: {
    street: "123 Nguyen Hue",
    city: "Ho Chi Minh City",
    postalCode: "700000",
    country: "Vietnam"
  }
};
```

### Các Biến Mẫu Mẫu Email

```html
<h2>Đơn Hàng #{{orderNumber}}</h2>
<p>Ngày: {{orderDate}}</p>
<p>Khách Hàng: {{customerName}}</p>
<p>Tổng Cộng: {{total}}₫</p>
<table>
  {{items}}
</table>
```

---

## 🔐 Kiểm Thử Bảo Mật

### Kiểm Thử Bảo Vệ Quản Trị Viên
- [ ] Xác minh những người không phải quản trị viên không thể truy cập các điểm cuối `/api/admin/*`
- [ ] Xác minh xác thực token hoạt động
- [ ] Kiểm tra giới hạn tốc độ đang hoạt động
- [ ] Kiểm tra tiêu đề CORS

### Kiểm Thử Quyền Riêng Tư Dữ Liệu
- [ ] Trạng thái đơn hàng không bộc lộ dữ liệu khách hàng nhạy cảm
- [ ] Người dùng không thể truy cập các đơn hàng của người dùng khác
- [ ] Tải tệp lên được xác thực thích hợp
- [ ] Các nỗ lực tiêm SQL bị ngăn chặn

---

## 📈 Kiểm Thử Hiệu Suất

### Kiểm Thử Tải Backend

```bash
# Sử dụng Apache Bench
ab -n 100 -c 10 http://localhost:5000/api/health
```

### Tối Ưu Hóa Cơ Sở Dữ Liệu

- [ ] Xác minh các chỉ mục MongoDB được tạo
- [ ] Kiểm tra hiệu suất truy vấn trong nhật ký bảng điều khiển
- [ ] Giám sát mức sử dụng bộ nhớ
- [ ] Kiểm tra với các bộ dữ liệu lớn

---

## 🚀 Danh Sách Kiểm Tra Triển Khai

Trước khi triển khai sang sản xuất:

- [ ] Tất cả các biến môi trường được cấu hình
- [ ] Sao lưu cơ sở dữ liệu được cấu hình
- [ ] Thông tin xác thực email được xác minh
- [ ] Thông tin xác thực cổng thanh toán được xác minh
- [ ] Chứng chỉ SSL được cài đặt
- [ ] CORS được cấu hình cho miền sản xuất
- [ ] Giới hạn tốc độ điều chỉnh
- [ ] Ghi nhật ký lỗi được cấu hình
- [ ] Giám sát được thiết lập
- [ ] Kế hoạch sao lưu đã có

---

## 📞 Hỗ Trợ & Tài Liệu

### Tài Liệu API Backend
- Xem `API_REFERENCE.md` để có tài liệu API hoàn chỉnh

### Hướng Dẫn Triển Khai
- Xem `IMPLEMENTATION_GUIDE.md` để có mô tả chi tiết các tính năng

### Thành Phần Frontend
- Xem các tệp thành phần riêng lẻ để có ví dụ sử dụng

---

## 🎯 Các Bước Tiếp Theo

1. **Kiểm thử tất cả các tính năng** bằng danh sách kiểm tra ở trên
2. **Lấy thông tin xác thực sandbox** từ các nhà cung cấp thanh toán
3. **Cấu hình thông tin xác thực email thực tế**
4. **Tạo tài khoản quản trị viên** trong cơ sở dữ liệu
5. **Thêm các sản phẩm và danh mục mẫu**
6. **Kiểm thử toàn bộ quy trình đặt hàng**
7. **Triển khai lên môi trường staging**
8. **Nhận phản hồi của người dùng**
9. **Triển khai lên sản xuất**

---

## 📅 Lịch Trình Ước Tính

| Nhiệm Vụ | Thời Lượng |
|------|----------|
| Cài Đặt Backend | 15 phút |
| Cài Đặt Frontend | 10 phút |
| Kiểm Thử Email | 15 phút |
| Kiểm Thử Thanh Toán | 30 phút |
| Kiểm Thử Excel | 20 phút |
| Kiểm Thử Hóa Đơn | 20 phút |
| Kiểm Thử Tích Hợp Đầy Đủ | 1 giờ |
| **Tổng Cộng** | **~2,5 giờ** |

---

## 💡 Mẹo

1. Sử dụng Postman hoặc Insomnia để kiểm thử API
2. Kiểm tra bảng điều khiển trình duyệt để tìm lỗi frontend
3. Kiểm tra bảng điều khiển backend để tìm thông báo lỗi chi tiết
4. Sử dụng MongoDB Compass để xem cơ sở dữ liệu
5. Sao lưu tệp .env một cách an toàn
6. Kiểm thử trên các thiết bị di động để thiết kế đáp ứng
7. Sử dụng Chrome DevTools để phân tích hiệu suất

---

**Phiên Bản Tài Liệu**: 1.0.0  
**Cập Nhật Lần Cuối**: 15 tháng 11 năm 2025  
**Trạng Thái**: Sẵn Sàng Kiểm Thử
