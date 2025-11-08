import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function NotificationBell() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const unread = useMemo(() => items.filter(i => !i.isRead).length, [items]);

  const showToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const load = async () => {
    try {
      const data = await api.listNotifications();
      setItems(data);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const goTo = async (n) => {
    if (!n) return;
    if (n.orderId) {
      const path = user?.role === 'admin' ? `/admin/orders/${n.orderId}` : `/orders`;
      navigate(path);
    } else if (user?.role === 'admin') {
      navigate('/admin');
    }
    if (!n.isRead) await markRead(n.id);
    setOpen(false);
  };

  useEffect(() => { if (user) load(); }, [user?.id]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (n) => {
      setItems(prev => [{ ...n, isRead: false }, ...prev].slice(0, 50));
      showToast(n.title || 'Thông báo mới');
    };
    const onCreated = (p) => showToast('Tạo đơn hàng thành công');
    const onStatus = (p) => showToast(`Đơn hàng cập nhật: ${p.label || p.status}`);
    socket.on('notifications:new', onNew);
    socket.on('order:created', onCreated);
    socket.on('order:status', onStatus);
    return () => {
      socket.off('notifications:new', onNew);
      socket.off('order:created', onCreated);
      socket.off('order:status', onStatus);
    };
  }, [socket]);

  if (!user) return null;

  return (
    <div className="nav-item dropdown me-2">
      <button className="btn btn-outline-secondary position-relative" data-bs-toggle="dropdown" aria-expanded={open} onClick={() => setOpen(v=>!v)}>
        <span className="me-1">🔔</span>
        {unread > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unread}
          </span>
        )}
      </button>
      <ul className="dropdown-menu dropdown-menu-end p-0" style={{ minWidth: 320 }} ref={listRef}>
        <li className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
          <strong>Thông báo</strong>
          <small className={`text-${connected ? 'success' : 'muted'}`}>{connected ? 'Realtime' : 'Offline'}</small>
        </li>
        {items.length === 0 && (
          <li className="px-3 py-3 text-muted">Chưa có thông báo</li>
        )}
        {items.slice(0, 10).map(n => (
          <li key={n.id} className="px-3 py-2 border-bottom" role="button" onClick={() => goTo(n)}>
            <div className="d-flex justify-content-between">
              <div>
                <div className="fw-semibold" style={{ fontSize: 14 }}>{n.title}</div>
                {n.message && <div className="text-muted" style={{ fontSize: 12 }}>{n.message}</div>}
                <div className="text-muted" style={{ fontSize: 11 }}>{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
              </div>
              {!n.isRead && (
                <button className="btn btn-sm btn-link" onClick={() => markRead(n.id)}>Đã đọc</button>
              )}
            </div>
          </li>
        ))}
        {items.length > 0 && <li className="px-3 py-2 text-center"><small className="text-muted">Hiển thị 10/ {items.length}</small></li>}
      </ul>

      {/* Lightweight Toasts */}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1080 }}>
        {toasts.map(t => (
          <div key={t.id} className="toast show mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="toast-body">
              {t.msg}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
