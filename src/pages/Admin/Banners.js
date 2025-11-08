import { useEffect, useState } from 'react';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const blank = { title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true, order: 0, startsAt: '', endsAt: '' };
  const [form, setForm] = useState(blank);

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${BASE}/api/admin/banners`, { headers: headers() });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setBanners(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => { setEditing(null); setForm(blank); };
  const startEdit = (b) => {
    setEditing(b.id);
    setForm({
      ...b,
      // Normalize to input[type=datetime-local] friendly format
      startsAt: b.startsAt ? new Date(b.startsAt).toISOString().slice(0, 16) : '',
      endsAt: b.endsAt ? new Date(b.endsAt).toISOString().slice(0, 16) : ''
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...form,
        // Convert back to Date for API (or null if empty)
        startsAt: form.startsAt ? new Date(form.startsAt) : null,
        endsAt: form.endsAt ? new Date(form.endsAt) : null
      };
      if (!body.imageUrl) return alert('Vui lòng nhập đường dẫn hình ảnh');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${BASE}/api/admin/banners/${editing}` : `${BASE}/api/admin/banners`;
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setForm(blank);
      setEditing(null);
      load();
    } catch (e) {
      alert('Lỗi lưu banner: ' + e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa banner này?')) return;
    try {
      const res = await fetch(`${BASE}/api/admin/banners/${id}`, { method: 'DELETE', headers: headers() });
      if (!(res.ok || res.status === 204)) throw new Error('HTTP ' + res.status);
      load();
    } catch (e) {
      alert('Lỗi xóa banner: ' + e.message);
    }
  };

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Banners</h2>
        <button className="btn btn-primary" onClick={startCreate}>Thêm banner</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Hình ảnh</th>
                <th>Tiêu đề</th>
                <th>Liên kết</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-4">Đang tải...</td></tr>
              ) : banners.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4 text-muted">Chưa có banner</td></tr>
              ) : banners.map(b => (
                <tr key={b.id}>
                  <td style={{ width: 90 }}>{b.order}</td>
                  <td style={{ width: 160 }}>
                    {b.imageUrl ? <img src={b.imageUrl} alt="" className="img-fluid rounded" /> : <div className="bg-light" style={{height:60}} />}
                  </td>
                  <td>
                    <div className="fw-semibold">{b.title || '(Không tiêu đề)'}</div>
                    <small className="text-muted">{b.subtitle}</small>
                  </td>
                  <td className="text-truncate" style={{maxWidth:220}}>
                    <a href={b.linkUrl} target="_blank" rel="noreferrer">{b.linkUrl}</a>
                  </td>
                  <td>
                    <span className={`badge bg-${b.isActive ? 'success':'secondary'}`}>{b.isActive ? 'Hiển thị' : 'Ẩn'}</span>
                  </td>
                  <td className="text-end" style={{ width: 180 }}>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(b)}>Sửa</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(b.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form tạo/sửa */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">{editing ? 'Sửa banner' : 'Thêm banner'}</h5>
          <form onSubmit={submit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Tiêu đề</label>
              <input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phụ đề</label>
              <input className="form-control" value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})} />
            </div>
            <div className="col-md-8">
              <label className="form-label">Ảnh (URL)</label>
              <input required className="form-control" value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Liên kết</label>
              <input className="form-control" value={form.linkUrl || ''} onChange={e=>setForm({...form,linkUrl:e.target.value})} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Thứ tự</label>
              <input type="number" className="form-control" value={form.order} onChange={e=>setForm({...form,order:Number(e.target.value)||0})} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Hiển thị</label>
              <select className="form-select" value={form.isActive? '1':'0'} onChange={e=>setForm({...form,isActive:e.target.value==='1'})}>
                <option value="1">Có</option>
                <option value="0">Không</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Bắt đầu</label>
              <input type="datetime-local" className="form-control" value={form.startsAt || ''} onChange={e=>setForm({...form,startsAt:e.target.value})} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Kết thúc</label>
              <input type="datetime-local" className="form-control" value={form.endsAt || ''} onChange={e=>setForm({...form,endsAt:e.target.value})} />
            </div>
            <div className="col-12">
              <button className="btn btn-primary">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
