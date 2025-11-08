import { useState, useEffect, useMemo } from 'react';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function BarChart({ data, labels, height = 180 }) {
  const max = Math.max(1, ...data);
  return (
    <div className="d-flex align-items-end gap-2" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="bg-primary rounded" style={{ width: 16, height: Math.max(4, (v / max) * (height - 24)) }} title={`${labels[i]}: ${v.toLocaleString('vi-VN')}₫`} />
      ))}
    </div>
  );
}

function Donut({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  let acc = 0;
  const circles = parts.map((p, idx) => {
    const frac = p.value / total;
    const dash = `${frac * 100} ${100 - frac * 100}`;
    const rot = `rotate(${(acc / total) * 360 - 90})`;
    acc += p.value;
    const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d'];
    return (
      <circle key={idx} r="16" cx="20" cy="20" fill="transparent" stroke={colors[idx % colors.length]} strokeWidth="8" strokeDasharray={dash} transform={rot} />
    );
  });
  return (
    <svg width="80" height="80" viewBox="0 0 40 40">{circles}</svg>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, totalProducts: 0, totalUsers: 0, recentOrders: [] });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) setStats(await res.json());
      } catch {}
    };
    const fetchHistory = async () => {
      try {
        const from = new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString();
        const to = new Date().toISOString();
        const url = new URL(`${BASE}/api/admin/order-history`);
        url.searchParams.set('from', from);
        url.searchParams.set('to', to);
        url.searchParams.set('limit', '200');
        const res = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.items || []);
        }
      } catch {}
    };
    fetchStats();
    fetchHistory();
  }, []);

  const revenueSeries = useMemo(() => {
    // last 14 days labels
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      return d;
    });
    const sums = days.map((d) => {
      const key = d.toDateString();
      return history
        .filter(h => new Date(h.createdAt).toDateString() === key)
        .reduce((s, h) => s + (h.total || 0), 0);
    });
    const labels = days.map(d => `${d.getDate()}/${d.getMonth()+1}`);
    return { labels, sums };
  }, [history]);

  const statusParts = useMemo(() => {
    const groups = history.reduce((acc, h) => (acc[h.status] = (acc[h.status] || 0) + 1, acc), {});
    const pretty = { completed: 'Hoàn thành', cancelled: 'Đã hủy', shipping: 'Đang giao', processing: 'Đang xử lý', pending: 'Chờ xử lý' };
    return Object.entries(groups).map(([k, v]) => ({ label: pretty[k] || k, value: v }));
  }, [history]);

  return (
    <div className="py-4">
      <h2 className="mb-3">Dashboard</h2>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-1">Tổng đơn hàng</h6>
              <div className="display-6">{stats.totalOrders}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-success shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-1">Tổng sản phẩm</h6>
              <div className="display-6">{stats.totalProducts}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-info shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-1">Tổng người dùng</h6>
              <div className="display-6">{stats.totalUsers}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-header"><strong>Doanh thu 14 ngày</strong></div>
            <div className="card-body">
              <BarChart data={revenueSeries.sums} labels={revenueSeries.labels} />
              <div className="d-flex justify-content-between mt-2 small text-muted">
                {revenueSeries.labels.map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header"><strong>Trạng thái đơn hàng</strong></div>
            <div className="card-body d-flex align-items-center gap-3">
              <Donut parts={statusParts} />
              <div className="small">
                {statusParts.map((p, i) => (
                  <div key={i}>{p.label}: <strong>{p.value}</strong></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Đơn hàng gần đây</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.code}</td>
                  <td>{order.customerName}</td>
                  <td>{order.total?.toLocaleString('vi-VN')}₫</td>
                  <td>
                    <span className={`badge bg-${
                      order.status === 'completed' ? 'success' :
                      order.status === 'cancelled' ? 'danger' :
                      'warning'
                    }`}>
                      {order.status === 'completed' ? 'Hoàn thành' :
                       order.status === 'cancelled' ? 'Đã hủy' :
                       'Đang xử lý'}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}