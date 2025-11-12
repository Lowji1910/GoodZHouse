import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    try {
      setLoading(true); setError('');
      const data = await api.listNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Không tải được thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let arr = items;
    if (q) {
      const t = q.toLowerCase();
      arr = arr.filter(n => (n.title||'').toLowerCase().includes(t) || (n.message||'').toLowerCase().includes(t));
    }
    if (type) arr = arr.filter(n => String(n.type) === type);
    if (status) arr = arr.filter(n => status === 'read' ? !!n.isRead : !n.isRead);
    if (from) arr = arr.filter(n => new Date(n.createdAt) >= new Date(from));
    if (to) arr = arr.filter(n => new Date(n.createdAt) <= new Date(to));
    return arr;
  }, [items, q, type, status, from, to]);

  const types = useMemo(() => {
    const s = new Set(items.map(n => n.type).filter(Boolean));
    return Array.from(s);
  }, [items]);

  const markOne = async (id) => {
    try {
      await api.markNotificationRead(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAll = async () => {
    const unread = filtered.filter(n => !n.isRead);
    for (const n of unread) {
      try { await api.markNotificationRead(n.id); } catch {}
    }
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">Thông báo</h2>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <input className="form-control" placeholder="Tìm tiêu đề/nội dung..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ maxWidth: 240 }} />
          <select className="form-select" value={type} onChange={(e)=>setType(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">Tất cả loại</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="form-select" value={status} onChange={(e)=>setStatus(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">Tất cả trạng thái</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>
          <input type="datetime-local" className="form-control" value={from} onChange={(e)=>setFrom(e.target.value)} />
          <input type="datetime-local" className="form-control" value={to} onChange={(e)=>setTo(e.target.value)} />
          <button className="btn btn-outline-secondary" onClick={()=>{ setQ(''); setType(''); setStatus(''); setFrom(''); setTo(''); }}>Xóa lọc</button>
          <button className="btn btn-primary" onClick={load} disabled={loading}>{loading ? 'Đang tải...' : 'Làm mới'}</button>
          <button className="btn btn-success" onClick={markAll} disabled={filtered.every(n=>n.isRead)}>Đánh dấu tất cả đã đọc</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-responsive" style={{ maxHeight: '70vh' }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Tiêu đề</th>
                <th>Nội dung</th>
                <th>Loại</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={6}>
                    <div className="placeholder-glow">
                      <span className="placeholder col-3 me-2"></span>
                      <span className="placeholder col-4 me-2"></span>
                      <span className="placeholder col-2 me-2"></span>
                    </div>
                  </td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-5"><div className="text-muted">Không có thông báo phù hợp.</div></td></tr>
              ) : (
                filtered.map(n => (
                  <tr key={n.id}>
                    <td className="fw-semibold" style={{ maxWidth: 260 }}>
                      <span className={!n.isRead ? 'text-primary' : ''}>{n.title}</span>
                    </td>
                    <td className="text-muted" style={{ maxWidth: 420 }}>
                      <span className="text-truncate d-inline-block" style={{ maxWidth: 420 }}>{n.message || '—'}</span>
                    </td>
                    <td><span className="badge bg-secondary">{n.type}</span></td>
                    <td>{new Date(n.createdAt).toLocaleString('vi-VN')}</td>
                    <td>{n.isRead ? <span className="badge bg-success">Đã đọc</span> : <span className="badge bg-warning text-dark">Chưa đọc</span>}</td>
                    <td className="text-end">
                      {!n.isRead && <button className="btn btn-sm btn-outline-primary" onClick={()=>markOne(n.id)}>Đánh dấu đã đọc</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
