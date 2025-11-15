import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${base}/api/orders/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setOrder(data);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const statusLabel = useMemo(() => {
    const m = { pending: 'Chờ xử lý', processing: 'Đang xử lý', shipping: 'Đang giao', delivered: 'Hoàn thành', completed: 'Hoàn thành', canceled: 'Đã hủy', cancelled: 'Đã hủy' };
    return m.String ? m.String(order?.status) : (m[String(order?.status)] || order?.status);
  }, [order?.status]);

  const updateStatus = async (status) => {
    try {
      setUpdating(true);
      const res = await fetch(`${base}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await load();
    } catch (e) {
      // noop
    } finally {
      setUpdating(false);
    }
  };

  const steps = useMemo(() => {
    const current = String(order?.status || '').toLowerCase();
    const orderIdx = ['pending','processing','shipping','completed','cancelled'];
    const idx = Math.max(0, orderIdx.indexOf(current));
    const items = [
      { key: 'pending', label: 'Chờ xử lý' },
      { key: 'processing', label: 'Đang xử lý' },
      { key: 'shipping', label: 'Đang giao' },
      { key: 'completed', label: 'Hoàn thành' }
    ];
    return items.map((s, i) => ({ ...s, done: current === 'cancelled' ? false : i <= idx, active: i === idx }));
  }, [order?.status]);

  if (loading) return <div className="py-4">Đang tải...</div>;
  if (!order) return <div className="py-4">Không tìm thấy đơn hàng</div>;

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="mb-0">Đơn hàng {order.id || id}</h3>
        <div className="d-flex align-items-center gap-2">
          <span className="me-2">Trạng thái:</span>
          <select className="form-select" style={{ maxWidth: 220 }} value={order.status}
            onChange={(e)=>updateStatus(e.target.value)} disabled={updating}>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <a
            href={`${base}/api/invoices/${order._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Print Invoice
          </a>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            {steps.map((s, i) => (
              <div key={s.key} className="d-flex align-items-center flex-fill" style={{ minWidth: 120 }}>
                <div className={`rounded-circle d-inline-flex align-items-center justify-content-center me-2 ${s.done ? 'bg-success text-white' : 'bg-light border'}`} style={{ width: 28, height: 28 }}>
                  {i+1}
                </div>
                <div className={s.active ? 'fw-semibold' : ''}>{s.label}</div>
                {i < steps.length - 1 && (
                  <div className={`flex-grow-1 mx-3 ${s.done ? 'bg-success' : 'bg-light'}`} style={{ height: 2 }} />
                )}
              </div>
            ))}
            {String(order.status).toLowerCase() === 'cancelled' && (
              <span className="badge bg-danger">Đã hủy</span>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Thông tin</div>
        <div className="card-body row g-3">
          <div className="col-md-4"><div className="text-muted">Khách hàng</div><div>{order.userId}</div></div>
          <div className="col-md-4"><div className="text-muted">Ngày đặt</div><div>{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}</div></div>
          <div className="col-md-4"><div className="text-muted">Trạng thái</div><div>{statusLabel}</div></div>
        </div>
      </div>

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
