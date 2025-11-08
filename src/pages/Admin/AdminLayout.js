import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (!user || user.role !== 'admin') return;
      if (msg.from && msg.from !== user.id) {
        setUnread((u) => u + 1);
      } else if (msg.from === user.id) {
        // When admin replies (echo message), clear badge
        setUnread(0);
      }
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket, user?.id]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/chat')) setUnread(0);
  }, [location.pathname]);
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 d-md-block bg-light sidebar">
          <div className="position-sticky top-0 pt-3" style={{ maxHeight: '100vh', overflow: 'auto' }}>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link className="nav-link" to="/admin/dashboard">
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/banners">
                  Banners
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/products">
                  Sản phẩm
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/categories">
                  Danh mục
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/orders">
                  Đơn hàng
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/coupons">
                  Coupons
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/order-history">
                  Lịch sử đơn hàng
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/users">
                  Người dùng
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center" to="/admin/chat">
                  Messages
                  {unread > 0 && (
                    <span className="badge rounded-pill bg-danger ms-2">{unread}</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Main content */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}