import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function AdminCategories() {
  const { notify } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', isActive: true });

  const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    fetchCategories(1, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async (p = 1, query = '') => {
    try {
      setLoading(true); setError('');
      const url = new URL(`${BASE}/api/admin/categories`);
      url.searchParams.set('limit', '8');
      url.searchParams.set('page', String(p));
      if (query) url.searchParams.set('q', query);
      const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      setCategories(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || p);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (e) => { e.preventDefault(); fetchCategories(1, q); };

  const startCreate = () => { setEditingId(null); setForm({ name: '', slug: '', description: '', isActive: true }); setShowForm(true); };
  const startEdit = (c) => { setEditingId(c.id); setForm({ name: c.name, slug: c.slug || '', description: c.description || '', isActive: c.isActive ?? true }); setShowForm(true); };
  const cancelForm = () => { setShowForm(false); setEditingId(null); };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      const res = await fetch(`${BASE}/api/categories${editingId ? '/' + editingId : ''}`,
        { method: editingId ? 'PATCH' : 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setShowForm(false); setEditingId(null);
      fetchCategories(page, q);
      notify(editingId ? 'Cập nhật danh mục thành công' : 'Tạo danh mục thành công', 'success');
    } catch (e1) { notify(e1.message || 'Lỗi khi lưu danh mục', 'danger'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa danh mục này?')) return;
    try {
      const res = await fetch(`${BASE}/api/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!(res.ok || res.status === 204)) throw new Error('HTTP ' + res.status);
      fetchCategories(page, q);
      notify('Đã xóa danh mục', 'success');
    } catch (e1) { notify(e1.message || 'Lỗi khi xóa danh mục', 'danger'); }
  };

  // Do not early-return; we'll show skeletons in table instead for UX consistency

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Quản lý danh mục</h2>
        <form className="d-flex" onSubmit={onSearch}>
          <input className="form-control me-2" placeholder="Tìm danh mục..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ maxWidth: 260 }} />
          <button className="btn btn-outline-primary">Tìm</button>
        </form>
        <button className="btn btn-primary" onClick={startCreate}>
          Thêm danh mục
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-responsive" style={{ maxHeight: '70vh' }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th>Số sản phẩm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4}>
                      <div className="placeholder-glow">
                        <span className="placeholder col-3 me-2"></span>
                        <span className="placeholder col-2 me-2"></span>
                        <span className="placeholder col-1 me-2"></span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="text-muted">Chưa có danh mục nào phù hợp.</div>
                  </td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td>{category.productCount}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>startEdit(category)}>
                        Sửa
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(category.id)}>
                        Xóa
                      </button>
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
        <small className="text-muted">Tổng: {total}</small>
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" disabled={page<=1} onClick={()=>fetchCategories(page-1, q)}>«</button>
          <span className="btn btn-outline-secondary btn-sm disabled">{page}/{pages}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={page>=pages} onClick={()=>fetchCategories(page+1, q)}>»</button>
        </div>
      </div>

      {/* Modal/Form create-edit */}
      {showForm && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingId ? 'Sửa danh mục' : 'Thêm danh mục'}</h5>
                <button type="button" className="btn-close" onClick={cancelForm}></button>
              </div>
              <form onSubmit={save}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên</label>
                    <input className="form-control" value={form.name} onChange={e=>setForm(s=>({...s,name:e.target.value}))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Slug</label>
                    <input className="form-control" value={form.slug} onChange={e=>setForm(s=>({...s,slug:e.target.value}))} placeholder="Tự sinh từ tên nếu để trống" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-control" value={form.description} onChange={e=>setForm(s=>({...s,description:e.target.value}))} rows={3} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Hiển thị</label>
                    <select className="form-select" value={form.isActive ? '1' : '0'} onChange={e=>setForm(s=>({...s,isActive:e.target.value==='1'}))}>
                      <option value="1">Có</option>
                      <option value="0">Không</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={cancelForm}>Hủy</button>
                  <button className="btn btn-primary">{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}