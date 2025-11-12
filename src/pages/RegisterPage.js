import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import registerImage from '../images/image2.png';
import gsap from 'gsap';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    ward: '',
    district: '',
    province: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const imgRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const tl = gsap.timeline({ defaults: { duration: 0.8, ease: 'power2.out' } });
    if (imgRef.current) {
      tl.from(imgRef.current, { autoAlpha: 0, y: 24 });
    }
    if (cardRef.current) {
      tl.from(cardRef.current, { autoAlpha: 0, y: 24 }, '-=0.4');
    }
    return () => {
      tl.kill();
    };
  }, []);

  const pwdStrength = useMemo(() => {
    const p = formData.password || '';
    let score = 0;
    if (p.length >= 6) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const clamped = Math.min(score, 4);
    const percent = (clamped / 4) * 100;
    const label = clamped <= 1 ? 'Yếu' : clamped === 2 ? 'Trung bình' : clamped === 3 ? 'Khá' : 'Mạnh';
    const color = clamped <= 1 ? 'bg-danger' : clamped === 2 ? 'bg-warning' : clamped === 3 ? 'bg-info' : 'bg-success';
    return { percent, label, color };
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp');
    }

    const phonePattern = /^(0|\+84)([3-9][0-9]{8})$/; // VN mobile rough pattern
    if (formData.phone && !phonePattern.test(formData.phone.replace(/\s/g, ''))) {
      return setError('Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)');
    }

    const street = formData.address?.trim();
    const ward = formData.ward?.trim();
    const district = formData.district?.trim();
    const province = formData.province?.trim();
    const composedAddress = [street, ward, district, province].filter(Boolean).join(', ');
    if (!composedAddress || composedAddress.length < 6) {
      return setError('Địa chỉ quá ngắn. Vui lòng nhập đầy đủ (ít nhất 6 ký tự)');
    }

    setError('');
    setLoading(true);
    
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: composedAddress
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-4 align-items-center">
        <div className="col-lg-6 d-none d-lg-block">
          <img ref={imgRef} src={registerImage} alt="Register" className="img-fluid rounded-3 shadow-sm w-100" style={{objectFit:'cover'}} />
          <div className="mt-3 ps-1">
            <h3 className="mb-1">Tạo tài khoản GoodzHouse</h3>
            <p className="text-muted mb-0">Lưu sản phẩm yêu thích, theo dõi đơn và nhận ưu đãi dành riêng cho bạn.</p>
          </div>
        </div>
        <div className="col-lg-5 col-xl-4 ms-lg-auto">
          <div ref={cardRef} className="card shadow-sm border-0 rounded-3">
            <div className="card-body p-4">
              <h2 className="mb-2 text-start">Đăng ký</h2>
              <div className="text-muted mb-3">Chỉ mất một phút để bắt đầu</div>

              {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label">Họ tên</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <div className="input-group">
                    <span className="input-group-text">@</span>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Mật khẩu</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="Mật khẩu của bạn"
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(v=>!v)}>
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  <div className="progress mt-2" style={{height:6}}>
                    <div className={`progress-bar ${pwdStrength.color}`} role="progressbar" style={{width: `${pwdStrength.percent}%`}} aria-valuenow={pwdStrength.percent} aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <small className="text-muted">Độ mạnh: {pwdStrength.label}</small>
                </div>

                <div>
                  <label className="form-label">Xác nhận mật khẩu</label>
                  <div className="input-group">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="form-control"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowConfirm(v=>!v)}>
                      {showConfirm ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0912345678 hoặc +84912345678"
                    pattern="^(0|\\+84)([3-9][0-9]{8})$"
                  />
                </div>

                <div>
                  <label className="form-label">Địa chỉ (Số nhà, đường)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Số 123, Lê Lợi"
                    minLength={6}
                    required
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Phường/Xã</label>
                    <input
                      type="text"
                      className="form-control"
                      name="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Quận/Huyện</label>
                    <input
                      type="text"
                      className="form-control"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Tỉnh/Thành</label>
                    <input
                      type="text"
                      className="form-control"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>

                <div className="text-center">
                  <span>Đã có tài khoản? </span>
                  <Link to="/login">Đăng nhập</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}