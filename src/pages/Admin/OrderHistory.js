import { useEffect, useState } from 'react';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function AdminOrderHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [userId, setUserId] = useState('');
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

  const load = async (p = 1) => {
    try {
      setLoading(true); setError('');
      const url = new URL(`${BASE}/api/admin/order-history`);
      url.searchParams.set('page', String(p));
      url.searchParams.set('limit', '8');
      if (userId) url.searchParams.set('userId', userId);
      if (productId) url.searchParams.set('productId', productId);
      if (status) url.searchParams.set('status', status);
      if (from) url.searchParams.set('from', new Date(from).toISOString());
      if (to) url.searchParams.set('to', new Date(to).toISOString());
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setItems(data.items || []);
      setPage(data.page || p);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); // eslint-disable-next-line
  }, []);

  const submitFilters = (e) => { e.preventDefault(); load(1); };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">Lịch sử đơn hàng</h2>
        <form className="d-flex flex-wrap align-items-center gap-2" onSubmit={submitFilters}>
          <input className="form-control" placeholder="UserId" style={{ maxWidth: 200 }} value={userId} onChange={(e)=>setUserId(e.target.value)} />
          <input className="form-control" placeholder="ProductId" style={{ maxWidth: 200 }} value={productId} onChange={(e)=>setProductId(e.target.value)} />
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
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id}>
                  <td>
                    <div className="fw-semibold">{row.user?.name || '—'}</div>
                    <small className="text-muted">{row.user?.email}</small>
                  </td>
                  <td>
                    <div className="small text-truncate" style={{maxWidth: 320}}>
                      {row.products?.map(p => `${p.name || p.id} x${p.qty}`).join(', ')}
                    </div>
                  </td>
                  <td>{row.total?.toLocaleString('vi-VN')}₫</td>
                  <td>
                    <span className={`badge bg-${row.status==='completed'?'success': row.status==='cancelled'?'danger': 'warning'}`}>{row.status}</span>
                  </td>
                  <td>{new Date(row.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <small className="text-muted">Tổng: {total}</small>
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" disabled={page<=1} onClick={()=>load(page-1)}>«</button>
          <span className="btn btn-outline-secondary btn-sm disabled">{page}/{pages}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={page>=pages} onClick={()=>load(page+1)}>»</button>
        </div>
      </div>
    </div>
  );
}
