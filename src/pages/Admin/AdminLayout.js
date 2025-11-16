import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/Notifications/NotificationBell';

export default function AdminLayout() {
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Restore collapsed state for persistent UX
    try {
      const saved = localStorage.getItem('adminSidebarCollapsed');
      if (saved === '1') setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (!user || user.role !== 'admin') return;
      if (msg.from && msg.from !== user.id) {
        setUnread((u) => u + 1);
      } else if (msg.from === user.id) {
        setUnread(0);
      }
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket, user?.id]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/chat')) setUnread(0);
  }, [location.pathname]);

  const crumbs = useMemo(() => {
    const parts = location.pathname.replace(/^\/+/, '').split('/');
    const acc = [];
    const out = [];
    parts.forEach((p) => {
      acc.push(p);
      out.push({ label: p === 'admin' ? 'Quản trị' : p, to: '/' + acc.join('/') });
    });
    return out.slice(0, 4);
  }, [location.pathname]);
  return (
    <div className="container-fluid">
      <div className="row">
        <div className={(collapsed ? 'col-auto' : 'col-md-3 col-lg-2') + ' d-md-block bg-light sidebar p-0'}>
          <div className="position-sticky top-0" style={{ maxHeight: '100vh', overflow: 'auto' }}>
            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
              <div className="fw-semibold">Admin</div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { const next = !collapsed; setCollapsed(next); try { localStorage.setItem('adminSidebarCollapsed', next ? '1' : '0'); } catch {} }}>
                {collapsed ? '»' : '«'}
              </button>
            </div>
            <ul className="nav nav-pills flex-column nav-flush py-2">
              <li className="nav-item"><NavLink title="Dashboard" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/dashboard">🏠<span style={{display: collapsed ? 'none' : 'inline'}}>Dashboard</span></NavLink></li>
              <li className="nav-item"><NavLink title="Banners" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/banners">🖼️<span style={{display: collapsed ? 'none' : 'inline'}}>Banners</span></NavLink></li>
              <li className="nav-item"><NavLink title="Sản phẩm" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/products">📦<span style={{display: collapsed ? 'none' : 'inline'}}>Sản phẩm</span></NavLink></li>
              <li className="nav-item"><NavLink title="Danh mục" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/categories">🏷️<span style={{display: collapsed ? 'none' : 'inline'}}>Danh mục</span></NavLink></li>
              <li className="nav-item"><NavLink title="Thông báo" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/notifications">🔔<span style={{display: collapsed ? 'none' : 'inline'}}>Thông báo</span></NavLink></li>
              <li className="nav-item"><NavLink title="Đơn hàng" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/orders">🧾<span style={{display: collapsed ? 'none' : 'inline'}}>Đơn hàng</span></NavLink></li>
              <li className="nav-item"><NavLink title="Coupons" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/coupons">🎟️<span style={{display: collapsed ? 'none' : 'inline'}}>Coupons</span></NavLink></li>
              <li className="nav-item"><NavLink title="Lịch sử đơn hàng" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/order-history">🕘<span style={{display: collapsed ? 'none' : 'inline'}}>Lịch sử đơn hàng</span></NavLink></li>
              <li className="nav-item"><NavLink title="Người dùng" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/users">👤<span style={{display: collapsed ? 'none' : 'inline'}}>Người dùng</span></NavLink></li>
              <li className="nav-item">
                <NavLink title="Messages" className={({isActive})=>"nav-link px-3 py-2 d-flex align-items-center gap-2 " + (isActive? 'active' : 'text-body-secondary')} to="/admin/chat">
                  💬<span style={{display: collapsed ? 'none' : 'inline'}}>Messages</span>{unread > 0 && (<span className="badge rounded-pill bg-danger ms-2">{unread}</span>)}
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
        <main className={(collapsed ? 'col' : 'col-md-9 col-lg-10') + ' ms-sm-auto px-md-4 p-0'}>
          <div className="position-sticky top-0 bg-white border-bottom px-3" style={{ zIndex: 1000 }}>
            <div className="d-flex align-items-center justify-content-between" style={{ minHeight: 56 }}>
              <div className="d-flex align-items-center gap-2">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb m-0">
                    {crumbs.map((c, i) => (
                      <li key={i} className={"breadcrumb-item " + (i === crumbs.length - 1 ? 'active' : '')} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                        {i === crumbs.length - 1 ? (c.label) : (<Link to={c.to}>{c.label}</Link>)}
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
              <div className="d-flex align-items-center gap-2">
                <NotificationBell />
                <input className="form-control form-control-sm" placeholder="Tìm kiếm..." style={{ maxWidth: 220 }} />
              </div>
            </div>
          </div>
          <div className="px-3">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}