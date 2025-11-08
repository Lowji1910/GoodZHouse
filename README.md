Tài Khoản Mật Khẩu:
 admin@goodzhouse.local
 → Admin@1234

## Hướng dẫn chạy dự án (Windows)

### 1) Yêu cầu
- Node.js 18+ và npm
- MongoDB đang chạy tại mongodb://localhost:27017

### 2) Cấu hình môi trường
- Backend: tạo file backend/.env
MONGODB_URI=mongodb://localhost:27017/goodzhouse
PORT=5000
JWT_SECRET=dev_access_secret_change_me
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
JWT_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
- Frontend (tùy chọn khi đổi port backend): tạo file .env ở thư mục gốc
REACT_APP_API_BASE_URL=http://localhost:5000

### 3) Cài đặt phụ thuộc
Chạy tại thư mục gốc dự án:
npm install
npm --prefix backend install

### 4) Chạy cả frontend + backend đồng thời (dev)
Tại thư mục gốc:
npm run dev
- Frontend chạy tại: http://localhost:3000
- Backend chạy tại: http://localhost:5000

### 5) Chạy từng phần (tùy chọn)
- Chỉ frontend (CRA):
npm start
- Chỉ backend (nodemon):
npm --prefix backend run dev

### 6) Build frontend (sản phẩm tĩnh)
npm run build
Output tại `build/`.

### 7) Lệnh hữu ích khác
- Kiểm tra health backend:
curl http://localhost:5000/health
- Kiểm tra API auth:
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@goodzhouse.local\",\"password\":\"Admin@1234\"}"

### 8) Lỗi thường gặp
- Port 5000 bị chiếm: đổi `PORT` trong `backend/.env` (vd 5001) và cập nhật `REACT_APP_API_BASE_URL` tương ứng, sau đó chạy lại `npm run dev`.
- React 19 không tương thích CRA 5: dự án đã khóa React 18.2.0.

 - Nếu muốn chạy frontend và backend cùng lúc thì trỏ vào thư mục gốc (goodzhouse) và chạy lệnh npm run dev
 - nhớ tải requirements.txt trước khi chạy để tránh gặp lỗi 

### 9) Cài nhanh tất cả thư viện qua CMD (Windows)

Chạy các lệnh sau trong CMD tại thư mục gốc dự án.

1) Frontend

```
:: Thư viện runtime
npm install ^
  react@18.2.0 ^
  react-dom@18.2.0 ^
  react-router-dom@^6.28.0 ^
  react-scripts@5.0.1 ^
  axios@^1.7.7 ^
  bootstrap@^5.3.8 ^
  gsap@^3.12.5 ^
  socket.io-client@^4.7.5 ^
  web-vitals@^2.1.4

:: Thư viện dev/test
npm install -D ^
  @testing-library/dom@^10.4.1 ^
  @testing-library/jest-dom@^6.9.1 ^
  @testing-library/react@^16.3.0 ^
  @testing-library/user-event@^13.5.0 ^
  concurrently@^9.0.1
```

2) Backend

```
:: Thư viện runtime
npm --prefix backend install ^
  express@^4.21.1 ^
  mongoose@^8.8.1 ^
  dotenv@^16.4.5 ^
  socket.io@^4.7.5 ^
  bcryptjs@^2.4.3 ^
  jsonwebtoken@^9.0.2 ^
  cors@^2.8.5

:: Thư viện dev
npm --prefix backend install -D nodemon@^3.1.7
```

Mẹo: bạn cũng có thể dùng `requirements.txt` như danh sách tham chiếu phiên bản khi cần cài thủ công.