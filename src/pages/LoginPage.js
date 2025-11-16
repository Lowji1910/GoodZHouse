import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('gh_login_email');
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }

    const fetchImage = async () => {
      try {
        const setting = await api.getSetting('loginImageUrl');
        if (setting.value) {
          setImageUrl(setting.value);
        }
      } catch (error) {
        // Use default image if setting not found
      }
    };
    fetchImage();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (remember) localStorage.setItem('gh_login_email', email);
      else localStorage.removeItem('gh_login_email');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-4 align-items-center">
        <div className="col-lg-6 d-none d-lg-block">
          <img src={imageUrl || '/images/default-login.jpg'} alt="Login" className="img-fluid rounded-3 shadow-sm w-100" style={{objectFit:'cover'}} />
          <div className="mt-3 ps-1">
            <h3 className="mb-1">Không gian sống ấm áp</h3>
            <p className="text-muted mb-0">Đăng nhập để theo dõi đơn, lưu sản phẩm yêu thích và nhận ưu đãi riêng.</p>
          </div>
        </div>
        <div className="col-lg-5 col-xl-4 ms-lg-auto">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-body p-4">
              <h2 className="mb-2 text-start">Đăng nhập</h2>
              <div className="text-muted mb-3">Chào mừng bạn trở lại</div>

              {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label">Email</label>
                  <div className="input-group">
                    <span className="input-group-text">@</span>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Mật khẩu</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(v=>!v)}>
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="rememberMe" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
                    <label className="form-check-label" htmlFor="rememberMe">Ghi nhớ email</label>
                  </div>
                  <div className="small text-muted">Quên mật khẩu?</div>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
                <div className="text-center">
                  <span>Chưa có tài khoản? </span>
                  <Link to="/register">Đăng ký</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

