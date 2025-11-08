import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    ward: '',
    district: '',
    province: ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const onSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setErr('');
    try {
      // Validate phone (VN patterns)
      const phonePattern = /^(0|\+84)([3-9][0-9]{8})$/;
      if (form.phone && !phonePattern.test(String(form.phone).replace(/\s/g, ''))) {
        throw new Error('Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)');
      }

      const street = form.address?.trim();
      const ward = form.ward?.trim();
      const district = form.district?.trim();
      const province = form.province?.trim();
      const composedAddress = [street, ward, district, province].filter(Boolean).join(', ');
      if (!composedAddress || composedAddress.length < 6) {
        throw new Error('Địa chỉ quá ngắn. Vui lòng nhập đầy đủ (ít nhất 6 ký tự)');
      }

      await updateProfile({ fullName: form.fullName, phone: form.phone, address: composedAddress });
      setMsg('Cập nhật hồ sơ thành công');
      
    } catch (e1) {
      setErr(e1.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg(''); setPwdErr('');
    if (!pwd.oldPassword || !pwd.newPassword) {
      setPwdErr('Vui lòng nhập đủ thông tin');
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      setPwdErr('Xác nhận mật khẩu không khớp');
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword({ oldPassword: pwd.oldPassword, newPassword: pwd.newPassword });
      setPwdMsg('Đổi mật khẩu thành công');
      setPwd({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (e2) {
      setPwdErr(e2.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">Hồ sơ</h2>
      <div className="row g-4 justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Thông tin tài khoản</h5>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-2">
                  <tbody>
                    <tr>
                      <th className="w-25">Email</th>
                      <td>{user?.email}</td>
                    </tr>
                    <tr>
                      <th>Vai trò</th>
                      <td>{user?.role}</td>
                    </tr>
                    <tr>
                      <th>Họ và tên</th>
                      <td>{user?.fullName || '-'}</td>
                    </tr>
                    <tr>
                      <th>Số điện thoại</th>
                      <td>{user?.phone || '-'}</td>
                    </tr>
                    <tr>
                      <th>Địa chỉ</th>
                      <td>{user?.address || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mb-3"><span className={`badge ${user?.isEmailVerified ? 'bg-success' : 'bg-secondary'}`}>{user?.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</span></div>

              {!showEdit && (
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-outline-secondary" onClick={()=>{
                    // Parse current address into parts when entering edit mode
                    const raw = user?.address || '';
                    const parts = raw.split(',').map(s=>s.trim());
                    const [street='', ward='', district='', province=''] = [parts[0]||'', parts[1]||'', parts[2]||'', parts.slice(3).join(', ')||''];
                    setShowPwd(false);
                    setShowEdit(true);
                    setMsg('');
                    setErr('');
                    setForm({ fullName: user?.fullName||'', phone: user?.phone||'', address: street, ward, district, province });
                  }}>
                    Chỉnh sửa
                  </button>
                  {!showPwd && !showEdit && (
                    <button className="btn btn-outline-primary" onClick={()=>{ setShowEdit(false); setShowPwd(true); }}>
                      Đổi mật khẩu
                    </button>
                  )}
                </div>
              )}

              {showEdit && (
                <>
                  {msg && <div className="alert alert-success py-2">{msg}</div>}
                  {err && <div className="alert alert-danger py-2">{err}</div>}
                  <form onSubmit={onSaveProfile}>
                    <div className="mb-3">
                      <label className="form-label">Họ và tên</label>
                      <input className="form-control" value={form.fullName} onChange={e=>setForm(s=>({...s, fullName:e.target.value}))} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Số điện thoại</label>
                      <input className="form-control" value={form.phone} onChange={e=>setForm(s=>({...s, phone:e.target.value}))} placeholder="0912345678 hoặc +84912345678" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Địa chỉ (Số nhà, đường)</label>
                      <input className="form-control" value={form.address} onChange={e=>setForm(s=>({...s, address:e.target.value}))} minLength={6} required />
                    </div>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Phường/Xã</label>
                        <input className="form-control" value={form.ward} onChange={e=>setForm(s=>({...s, ward:e.target.value}))} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Quận/Huyện</label>
                        <input className="form-control" value={form.district} onChange={e=>setForm(s=>({...s, district:e.target.value}))} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Tỉnh/Thành</label>
                        <input className="form-control" value={form.province} onChange={e=>setForm(s=>({...s, province:e.target.value}))} required />
                      </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-light" onClick={()=>{ setShowEdit(false); setErr(''); setMsg(''); setForm({ fullName: user?.fullName||'', phone: user?.phone||'', address: user?.address||'', ward:'', district:'', province:'' }); }}>Hủy</button>
                      <button className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                    </div>
                  </form>
                </>
              )}

              {showPwd && !showEdit && (
                <>
                  {pwdMsg && <div className="alert alert-success py-2">{pwdMsg}</div>}
                  {pwdErr && <div className="alert alert-danger py-2">{pwdErr}</div>}
                  <form onSubmit={onChangePassword}>
                    <div className="mb-3">
                      <label className="form-label">Mật khẩu hiện tại</label>
                      <input type="password" className="form-control" value={pwd.oldPassword} onChange={e=>setPwd(s=>({...s, oldPassword:e.target.value}))} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Mật khẩu mới</label>
                      <input type="password" className="form-control" value={pwd.newPassword} onChange={e=>setPwd(s=>({...s, newPassword:e.target.value}))} required minLength={6} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Xác nhận mật khẩu mới</label>
                      <input type="password" className="form-control" value={pwd.confirm} onChange={e=>setPwd(s=>({...s, confirm:e.target.value}))} required minLength={6} />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-light" onClick={()=>{ setShowPwd(false); setPwdErr(''); setPwdMsg(''); setPwd({ oldPassword:'', newPassword:'', confirm:'' }); }}>Hủy</button>
                      <button className="btn btn-outline-primary" disabled={pwdSaving}>{pwdSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

