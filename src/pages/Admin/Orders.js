import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async (p = 1) => {
    try {
      setLoading(true); setError('');
      const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const url = new URL(`${base}/api/admin/orders`);
      url.searchParams.set('limit', '8');
      url.searchParams.set('page', String(p));
      if (q) url.searchParams.set('q', q);
      if (status) url.searchParams.set('status', status);
      if (from) url.searchParams.set('from', new Date(from).toISOString());
      if (to) url.searchParams.set('to', new Date(to).toISOString());
      const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      setOrders(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || p);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/admin/orders/${orderId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );
      
      if (response.ok) {
        fetchOrders(page); // Refresh orders with current filters
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const submitFilters = (e) => { e.preventDefault(); fetchOrders(1); };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">Quản lý đơn hàng</h2>
        <form className="d-flex flex-wrap align-items-center gap-2" onSubmit={submitFilters}>
          <input className="form-control" placeholder="Tìm theo khách hàng..." style={{ maxWidth: 220 }} value={q} onChange={(e)=>setQ(e.target.value)} />
          <select className="form-select" style={{ maxWidth: 180 }} value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <input type="datetime-local" className="form-control" value={from} onChange={(e)=>setFrom(e.target.value)} />
          <input type="datetime-local" className="form-control" value={to} onChange={(e)=>setTo(e.target.value)} />
          <button className="btn btn-outline-primary">Lọc</button>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Ngày đặt</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.code}</td>
                  <td>{order.customerName}</td>
                  <td>{order.total?.toLocaleString('vi-VN')}₫</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="shipping">Đang giao</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <small className="text-muted">Tổng: {total}</small>
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" disabled={page<=1} onClick={()=>fetchOrders(page-1)}>«</button>
          <span className="btn btn-outline-secondary btn-sm disabled">{page}/{pages}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={page>=pages} onClick={()=>fetchOrders(page+1)}>»</button>
        </div>
      </div>
    </div>
  );
}