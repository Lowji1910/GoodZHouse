import { useState, useEffect } from 'react';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter states
  const [filterUserId, setFilterUserId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterIsRead, setFilterIsRead] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('single'); // single or broadcast
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    userId: '',
  });

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  });

  // Load notifications
  const loadNotifications = async (p = 1) => {
    try {
      setLoading(true);
      setError('');
      const url = new URL(`${BASE}/api/admin/notifications`);
      url.searchParams.set('page', String(p));
      url.searchParams.set('limit', '10');
      if (filterUserId) url.searchParams.set('userId', filterUserId);
      if (filterType) url.searchParams.set('type', filterType);
      if (filterIsRead !== '') url.searchParams.set('isRead', filterIsRead);

      const response = await fetch(url.toString(), { headers: headers() });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      setNotifications(data.items || []);
      setPage(data.page || 1);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Lỗi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  // Load users for select
  const loadUsers = async () => {
    try {
      const response = await fetch(`${BASE}/api/admin/notifications/users/list`, {
        headers: headers(),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
    }
  };

  useEffect(() => {
    loadNotifications(1);
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send notification
  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title) {
      setError('Tiêu đề không được để trống');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const endpoint = formType === 'broadcast'
        ? `${BASE}/api/admin/notifications/broadcast`
        : `${BASE}/api/admin/notifications`;

      const payload = formType === 'broadcast'
        ? { title: form.title, message: form.message, type: form.type }
        : { title: form.title, message: form.message, type: form.type, userId: form.userId };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);
      setSuccess(`✓ Gửi thành công${formType === 'broadcast' ? ' tới tất cả người dùng' : ''}`);
      setForm({ title: '', message: '', type: 'info', userId: '' });
      setShowForm(false);
      loadNotifications(1);
    } catch (err) {
      setError(err.message || 'Lỗi gửi thông báo');
    }
  };

  // Mark as read
  const handleMarkRead = async (id) => {
    try {
      const response = await fetch(`${BASE}/api/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: headers(),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      loadNotifications(page);
    } catch (err) {
      setError(err.message || 'Lỗi cập nhật');
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    if (!window.confirm('Xóa thông báo này?')) return;
    try {
      const response = await fetch(`${BASE}/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      setSuccess('✓ Đã xóa');
      loadNotifications(page);
    } catch (err) {
      setError(err.message || 'Lỗi xóa');
    }
  };

  // Bulk: mark all as read for a user
  const handleMarkAllReadForUser = async (userId) => {
    if (!userId) return;
    if (!window.confirm('Đánh dấu tất cả thông báo của người dùng này là đã đọc?')) return;
    try {
      setError('');
      const resp = await fetch(`${BASE}/api/admin/notifications/user/${userId}/read`, {
        method: 'PATCH',
        headers: headers(),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      setSuccess('Đã đánh dấu tất cả là đã đọc');
      loadNotifications(page);
    } catch (err) {
      setError(err.message || 'Lỗi khi đánh dấu');
    }
  };

  // Bulk: delete all notifications for a user
  const handleDeleteAllForUser = async (userId) => {
    if (!userId) return;
    if (!window.confirm('Xóa tất cả thông báo của người dùng này?')) return;
    try {
      setError('');
      const resp = await fetch(`${BASE}/api/admin/notifications/user/${userId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      setSuccess('Đã xóa tất cả thông báo của người này');
      loadNotifications(1);
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Quản Lý Thông Báo</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hủy' : '+ Gửi Thông Báo'}
        </button>
      </div>

      {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {/* Send Form */}
      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="mb-3">Gửi Thông Báo</h5>
            <form onSubmit={handleSend}>
              <div className="row g-3">
                <div className="col-12">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="formType"
                      id="typeS"
                      value="single"
                      checked={formType === 'single'}
                      onChange={(e) => setFormType(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="typeS">
                      Gửi cho một người
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="formType"
                      id="typeB"
                      value="broadcast"
                      checked={formType === 'broadcast'}
                      onChange={(e) => setFormType(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="typeB">
                      Gửi cho tất cả
                    </label>
                  </div>
                </div>

                {formType === 'single' && (
                  <div className="col-md-6">
                    <label className="form-label">Chọn Người Dùng</label>
                    <select
                      className="form-select"
                      value={form.userId}
                      onChange={(e) => setForm({ ...form, userId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn người dùng --</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullName} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-md-6">
                  <label className="form-label">Loại</label>
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="info">Thông tin</option>
                    <option value="success">Thành công</option>
                    <option value="warning">Cảnh báo</option>
                    <option value="error">Lỗi</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Tiêu Đề</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Nhập tiêu đề"
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Nội Dung</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Nhập nội dung (tuỳ chọn)"
                  />
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-primary">
                    Gửi Thông Báo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Bộ Lọc</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Người Dùng</label>
              <select
                className="form-select"
                value={filterUserId}
                onChange={(e) => {
                  setFilterUserId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Loại</label>
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="info">Thông tin</option>
                <option value="success">Thành công</option>
                <option value="warning">Cảnh báo</option>
                <option value="error">Lỗi</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Trạng Thái</label>
              <select
                className="form-select"
                value={filterIsRead}
                onChange={(e) => {
                  setFilterIsRead(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="false">Chưa đọc</option>
                <option value="true">Đã đọc</option>
              </select>
            </div>

            <div className="col-12">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFilterUserId('');
                  setFilterType('');
                  setFilterIsRead('');
                  setPage(1);
                }}
              >
                Xóa Bộ Lọc
              </button>
              <button className="btn btn-primary ms-2" onClick={() => loadNotifications(1)} disabled={loading}>
                {loading ? 'Đang tải...' : 'Làm Mới'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="card shadow-sm">
        <div className="table-responsive" style={{ maxHeight: '70vh' }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Tiêu Đề</th>
                <th>Người Dùng</th>
                <th>Loại</th>
                <th>Trạng Thái</th>
                <th>Ngày Tạo</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Đang tải...
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    Không có thông báo
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n._id} className={n.isRead ? '' : 'fw-semibold'}>
                    <td>
                      <div className="fw-semibold">{n.title}</div>
                      {n.message && <small className="text-muted">{n.message}</small>}
                    </td>
                    <td>
                      {n.userId ? (
                        <div>
                          <div className="fw-semibold">{n.userId.fullName}</div>
                          <small className="text-muted">{n.userId.email}</small>
                        </div>
                      ) : (
                        <span className="badge bg-secondary">Toàn Bộ</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge bg-${
                          n.type === 'success'
                            ? 'success'
                            : n.type === 'warning'
                            ? 'warning'
                            : n.type === 'error'
                            ? 'danger'
                            : 'info'
                        }`}
                      >
                        {n.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${n.isRead ? 'secondary' : 'primary'}`}>
                        {n.isRead ? 'Đã đọc' : 'Chưa đọc'}
                      </span>
                    </td>
                    <td>
                      <small>{new Date(n.createdAt).toLocaleString('vi-VN')}</small>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        {!n.isRead && (
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleMarkRead(n._id)}
                            title="Đánh dấu đã đọc"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(n._id)}
                          title="Xóa"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <small className="text-muted">
          Tổng: {total} | Trang {page}/{pages}
        </small>
        <div className="btn-group">
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => loadNotifications(page - 1)}
          >
            «
          </button>
          <span className="btn btn-outline-secondary btn-sm disabled">
            {page}/{pages}
          </span>
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={page >= pages}
            onClick={() => loadNotifications(page + 1)}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
