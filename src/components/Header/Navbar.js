import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import * as bootstrap from 'bootstrap';
import NotificationBell from '../Notifications/NotificationBell';

export default function Navbar() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/categories`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        if (isMounted) {
          console.log('Categories:', data); // Để kiểm tra dữ liệu
          setCategories(data);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          setCategories([]);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const { count } = useCart();
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
    {user && user.isSuspended && (
      <div className="alert alert-danger text-center m-0 rounded-0">
        Tài khoản của bạn đã bị khóa. Một số chức năng sẽ bị hạn chế.
      </div>
    )}
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">GoodzHouse</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><NavLink className="nav-link" to="/">Trang chủ</NavLink></li>
            <li className="nav-item dropdown">
              <a 
                className="nav-link dropdown-toggle" 
                href="#" 
                role="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                Danh mục
              </a>
              <ul className="dropdown-menu">
                {categories.map((c) => (
                  <li key={c.id || c._id}>
                    <Link 
                      className="dropdown-item" 
                      to={`/products?category=${c.name}&page=1`}
                      onClick={(e) => {
                        // Đóng dropdown khi click
                        const dropdownEl = e.target.closest('.dropdown');
                        const dropdown = bootstrap.Dropdown.getInstance(dropdownEl.querySelector('.dropdown-toggle'));
                        if (dropdown) dropdown.hide();
                      }}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
                {categories.length === 0 && (
                  <li><span className="dropdown-item text-muted">Đang tải...</span></li>
                )}
              </ul>
            </li>
            <li className="nav-item"><NavLink className="nav-link" to="/about">Giới thiệu</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/contact">Liên hệ</NavLink></li>
          </ul>
          <ul className="navbar-nav ms-auto align-items-center">
            {user && (
              <li className="nav-item me-2">
                <button 
                  className="btn btn-outline-primary position-relative" 
                  data-bs-toggle="offcanvas" 
                  data-bs-target="#offcanvasCart"
                >
                  Giỏ hàng
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {count}
                  </span>
                </button>
              </li>
            )}

            {user && (
              <li className="nav-item me-2">
                <NotificationBell />
              </li>
            )}

            {user && (
              <li className="nav-item me-2">
                <button className="btn btn-outline-success" data-bs-toggle="modal" data-bs-target="#chatModal">
                  Chat
                </button>
              </li>
            )}
            
            {!user ? (
              <li className="nav-item"><NavLink className="nav-link" to="/login">Đăng nhập</NavLink></li>
            ) : (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  {user.name || user.email}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {isAdmin && (
                    <li>
                      <Link className="dropdown-item" to="/admin">
                        Quản trị website
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      Thông tin tài khoản
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/orders">
                      Đơn hàng của tôi
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item text-danger" 
                      onClick={logout}
                    >
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
    </>
  );
}

