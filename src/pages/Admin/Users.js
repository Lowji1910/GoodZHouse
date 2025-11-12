import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminUsers() {
  const { notify } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '', role: 'customer', isSuspended: false, isEmailVerified: false, createdAt: '' });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true); setError('');
      const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${base}/api/admin/users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      setError(error.message);
      notify('Không tải được danh sách người dùng', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (u) => {
    try {
      const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/admin/users/${u.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setDetailId(data.id);
      setForm({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        role: data.role || 'customer',
        isSuspended: !!data.isSuspended,
        isEmailVerified: !!data.isEmailVerified,
        createdAt: data.createdAt || ''
      });
      setShowModal(true);
    } catch (e) { notify(e.message || 'Không tải được chi tiết người dùng', 'danger'); }
  };

  const closeModal = () => { setShowModal(false); setDetailId(null); };

  const saveDetail = async (e) => {
    e.preventDefault();
    try {
      const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const payload = { fullName: form.fullName, phone: form.phone, address: form.address, role: form.role, isSuspended: form.isSuspended, isEmailVerified: form.isEmailVerified };
      const res = await fetch(`${base}/api/admin/users/${detailId}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      closeModal();
      fetchUsers();
    } catch (e) { alert(e.message); }
  };

  const removeUser = async () => {
    if (!window.confirm('Xóa người dùng này?')) return;
    try {
      const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/admin/users/${detailId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!(res.ok || res.status === 204)) throw new Error('HTTP ' + res.status);
      closeModal();
      fetchUsers();
    } catch (e) { alert(e.message); }
  };

  const updateUser = async (userId, updates) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/admin/users/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        }
      );
      if (response.ok) { fetchUsers(); notify('Đã cập nhật người dùng', 'success'); }
    } catch (error) {
      notify('Không cập nhật được người dùng', 'danger');
    }
  };

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim().toLowerCase();
    if (!term) return fetchUsers();
    // client-side filter nhanh
    setUsers(u => u.filter(x => (x.fullName||'').toLowerCase().includes(term) || (x.email||'').toLowerCase().includes(term)));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Quản lý người dùng</h2>
        <form className="d-flex" onSubmit={onSearch}>
          <input className="form-control me-2" placeholder="Tìm theo tên hoặc email..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ maxWidth: 260 }} />
          <button className="btn btn-outline-primary">Tìm</button>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Quyền</th>
                <th>Khóa</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.fullName || '—'}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={!!user.isSuspended} onChange={()=>updateUser(user.id, { isSuspended: !user.isSuspended })} />
                    </div>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '—'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary" onClick={()=>openDetail(user)}>Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Thông tin người dùng</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={saveDetail}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Họ tên</label>
                    <input className="form-control" value={form.fullName} onChange={e=>setForm(s=>({...s, fullName:e.target.value}))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={form.email} disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Số điện thoại</label>
                    <input className="form-control" value={form.phone} onChange={e=>setForm(s=>({...s, phone:e.target.value}))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Địa chỉ</label>
                    <input className="form-control" value={form.address} onChange={e=>setForm(s=>({...s, address:e.target.value}))} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Quyền</label>
                      <select className="form-select" value={form.role} onChange={e=>setForm(s=>({...s, role:e.target.value}))}>
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email xác thực</label>
                      <select className="form-select" value={form.isEmailVerified? '1':'0'} onChange={e=>setForm(s=>({...s, isEmailVerified:e.target.value==='1'}))}>
                        <option value="1">Đã xác thực</option>
                        <option value="0">Chưa</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-check form-switch mt-3">
                    <input className="form-check-input" type="checkbox" checked={!!form.isSuspended} onChange={e=>setForm(s=>({...s, isSuspended:e.target.checked}))} />
                    <label className="form-check-label">Khóa tài khoản</label>
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-danger" onClick={removeUser}>Xóa</button>
                  <div>
                    <button type="button" className="btn btn-secondary me-2" onClick={closeModal}>Đóng</button>
                    <button className="btn btn-primary">Lưu</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}