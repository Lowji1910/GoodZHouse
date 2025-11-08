import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api.getOrder(orderId)
      .then((o) => { if (mounted) setOrder(o); })
      .catch((err) => { if (mounted) setError(err.message || 'Không thể tải đơn hàng'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [orderId]);

  if (loading) return <div className="container py-4">Đang tải...</div>;
  if (error) return <div className="container py-4 text-danger">Lỗi: {error}</div>;
  if (!order) return <div className="container py-4">Không tìm thấy đơn hàng.</div>;

  return (
    <div className="container py-4">
      <h2>Thanh toán đơn hàng</h2>
      <div className="card shadow-sm mt-3">
        <div className="card-body">
          <div className="d-flex justify-content-between">
            <div>
              <div className="text-muted">Mã đơn hàng</div>
              <div className="fw-semibold">{order.id}</div>
            </div>
            <div className="text-end">
              <div className="text-muted">Tổng tiền</div>
              <div className="fw-bold text-danger">{order.total?.toLocaleString('vi-VN')}₫</div>
            </div>
          </div>

          <hr />

          <p>Trạng thái hiện tại: <span className="badge bg-secondary text-uppercase">{order.status}</span></p>

          <div className="alert alert-info">
            Tích hợp thanh toán MoMo/VNPay sẽ được thêm sau. Tại đây sẽ hiển thị nút chuyển hướng đến cổng thanh toán hoặc mã QR.
          </div>

          <div className="d-flex gap-2">
            <Link className="btn btn-outline-primary" to="/orders">Xem lịch sử đơn hàng</Link>
            <Link className="btn btn-primary" to="/">Tiếp tục mua sắm</Link>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="card-body">
          <h5>Chi tiết sản phẩm</h5>
          <div className="d-flex justify-content-between">
            <div>Tạm tính</div>
            <div>{(order.items?.reduce((s, it) => s + (it.price*it.quantity), 0) || 0).toLocaleString('vi-VN')}₫</div>
          </div>
          {order.couponCode && (
            <div className="d-flex justify-content-between text-success">
              <div>Giảm ({order.couponCode})</div>
              <div>-{(order.discount||0).toLocaleString('vi-VN')}₫</div>
            </div>
          )}
          <div className="d-flex justify-content-between mb-3">
            <div className="fw-bold">Tổng tiền</div>
            <div className="fw-bold text-danger">{order.total?.toLocaleString('vi-VN')}₫</div>
          </div>
          <ul className="list-group list-group-flush">
            {order.items?.map((it, idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between">
                <div>x{it.quantity}</div>
                <div>{(it.price * it.quantity).toLocaleString('vi-VN')}₫</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
