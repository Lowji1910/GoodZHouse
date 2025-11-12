# GoodZHouse – Hướng dẫn cài đặt và chạy

## 1) Yêu cầu hệ thống
- Node.js ≥ 18 (kèm npm)
- MongoDB local: mongodb://localhost:27017

## 2) Cấu hình môi trường (tạo file cần thiết)
- Backend: tạo file `backend/.env`
  - `MONGODB_URI=mongodb://localhost:27017/goodzhouse`
  - `PORT=5000`
  - `JWT_SECRET=dev_access_secret_change_me`
  - `JWT_REFRESH_SECRET=dev_refresh_secret_change_me`
  - `JWT_EXPIRES=15m`
  - `JWT_REFRESH_EXPIRES=7d`

- Frontend (tùy chọn khi đổi port backend): tạo file `.env` ở thư mục gốc
  - `REACT_APP_API_BASE_URL=http://localhost:5000`

## 3) Cài đặt thư viện
Chạy các lệnh sau tại thư mục gốc dự án (PowerShell – Windows). Trên macOS/Linux bỏ ký tự xuống dòng dạng PowerShell (\`).

- Cài đặt frontend + dev tools (theo package.json):
  - `npm install`

- Cài đặt backend:
  - `npm --prefix backend install`

Tham chiếu phiên bản có trong `requirements.txt` (chỉ để đối chiếu).

## 4) Chạy dự án (dev)
- Chạy cả Frontend + Backend đồng thời:
  - `npm run dev`

- Truy cập:
  - Frontend: http://localhost:3000
  - Backend: http://localhost:5000

- Chạy riêng lẻ nếu cần:
  - Frontend: `npm start`
  - Backend: `npm --prefix backend run dev`

## 5) Build sản phẩm (frontend tĩnh)
- `npm run build`
- Output: thư mục `build/`

## 6) Kiểm tra nhanh API
- Sức khỏe backend: `curl http://localhost:5000/health`
- Đăng nhập API mẫu:
  ```sh
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@goodzhouse.local","password":"Admin@1234"}'
  ```

## 7) Lỗi thường gặp
- **Port 5000 bị chiếm**: đổi `PORT` trong `backend/.env` (ví dụ 5001) và cập nhật `REACT_APP_API_BASE_URL` tương ứng.
- **Không tương thích CRA**: dự án cố định React 18.2.0 cho CRA 5.
- **Thiếu thư viện**: đảm bảo đã chạy mục 3 (npm install ở root và backend).