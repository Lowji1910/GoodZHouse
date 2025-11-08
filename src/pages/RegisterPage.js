import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Đăng ký</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
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

                <div className="mb-3">
                  <label className="form-label">Email</label>
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

                <div className="mb-3">
                  <label className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Mật khẩu của bạn"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0912345678 hoặc +84912345678"
                    pattern="^(0|\+84)([3-9][0-9]{8})$"
                  />
                </div>

                <div className="mb-3">
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
                  className="btn btn-primary w-100 mb-3"
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