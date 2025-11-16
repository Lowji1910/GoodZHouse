import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${base}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (mounted) setOrder(data);
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [orderId]);

  const statusLabel = useMemo(() => {
    const m = { pending: 'Chờ xử lý', processing: 'Đang xử lý', shipping: 'Đang giao', delivered: 'Hoàn thành', completed: 'Hoàn thành', canceled: 'Đã hủy', cancelled: 'Đã hủy' };
    return m[String(order?.status)] || order?.status;
  }, [order?.status]);

  if (loading) return <div className="container py-4">Đang tải...</div>;
  if (!order) return <div className="container py-4">Không tìm thấy đơn hàng</div>;

  return (
    <div className="container py-4">
      <h3 className="mb-3">Chi tiết đơn hàng</h3>
      <div className="mb-3">Mã đơn: <strong>{order.orderNumber ? `#${order.orderNumber}` : order.id}</strong></div>
      <div className="mb-3">Ngày đặt: <strong>{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}</strong></div>
      <div className="mb-3">Trạng thái: <span className="badge bg-secondary">{statusLabel}</span></div>

      <div className="card mb-3">
        <div className="card-header">Sản phẩm</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá</th><th>Tạm tính</th></tr></thead>
            <tbody>
              {(order.items||[]).map((it, idx) => (
                <tr key={idx}>
                  <td>{it.productId}</td>
                  <td>{it.quantity}</td>
                  <td>{Number(it.price||0).toLocaleString('vi-VN')}₫</td>
                  <td>{Number((it.price||0) * (it.quantity||0)).toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-body d-flex justify-content-end">
          <div className="text-end">
            <div>Tổng: <strong>{Number(order.total||0).toLocaleString('vi-VN')}₫</strong></div>
            {order.discount ? <div>Giảm giá: <strong>-{Number(order.discount).toLocaleString('vi-VN')}₫</strong></div> : null}
            {order.couponCode ? <div>Mã giảm: <strong>{order.couponCode}</strong></div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
