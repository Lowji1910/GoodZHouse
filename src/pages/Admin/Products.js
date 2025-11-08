import { useState, useEffect } from 'react';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', price: '', stock: '', image: '', categoryId: '', description: '' });

  const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    fetchProducts(1, q);
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async (p = 1, query = '') => {
    try {
      setLoading(true); setError('');
      const url = new URL(`${BASE}/api/admin/products`);
      url.searchParams.set('limit', '8');
      url.searchParams.set('page', String(p));
      if (query) url.searchParams.set('q', query);
      const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      setProducts(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || p);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE}/api/categories`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      // ignore but keep available empty
    }
  };

  const onSearch = (e) => { e.preventDefault(); fetchProducts(1, q); };

  const startCreate = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', price: '', stock: '', image: '', categoryId: '', description: '' });
    setShowForm(true);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      slug: p.slug || '',
      price: p.price || '',
      stock: p.inStock ? 1 : 0,
      image: p.image || '',
      categoryId: '',
      description: ''
    });
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        images: form.image ? [form.image] : [],
        categoryIds: form.categoryId ? [form.categoryId] : [],
        description: form.description || ''
      };
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${BASE}/api/admin/products/${editingId}` : `${BASE}/api/admin/products`;
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setShowForm(false); setEditingId(null);
      fetchProducts(page, q);
    } catch (e1) { alert(e1.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`${BASE}/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!(res.ok || res.status === 204)) throw new Error('HTTP ' + res.status);
      fetchProducts(page, q);
    } catch (e1) { alert(e1.message); }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Quản lý sản phẩm</h2>
        <form className="d-flex" onSubmit={onSearch}>
          <input className="form-control me-2" placeholder="Tìm sản phẩm..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ maxWidth: 260 }} />
          <button className="btn btn-outline-primary">Tìm</button>
        </form>
        <button className="btn btn-primary" onClick={startCreate}>Thêm sản phẩm</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td style={{width: 80}}>
                    {product.image ? (
                      <img src={product.image} alt="" className="img-thumbnail" style={{height: 50}} />
                    ) : (
                      <div className="bg-light rounded" style={{width: 50, height: 50}} />
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category?.name}</td>
                  <td>{product.price?.toLocaleString('vi-VN')}₫</td>
                  <td>
                    <span className={`badge bg-${product.inStock ? 'success' : 'danger'}`}>
                      {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>startEdit(product)}>
                      Sửa
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(product.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <small className="text-muted">Tổng: {total}</small>
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" disabled={page<=1} onClick={()=>fetchProducts(page-1, q)}>«</button>
          <span className="btn btn-outline-secondary btn-sm disabled">{page}/{pages}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={page>=pages} onClick={()=>fetchProducts(page+1, q)}>»</button>
        </div>
      </div>

      {/* Modal create/edit */}
      {showForm && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h5>
                <button type="button" className="btn-close" onClick={cancelForm}></button>
              </div>
              <form onSubmit={save}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Tên</label>
                      <input className="form-control" value={form.name} onChange={e=>setForm(s=>({...s,name:e.target.value}))} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Slug</label>
                      <input className="form-control" value={form.slug} onChange={e=>setForm(s=>({...s,slug:e.target.value}))} placeholder="Tự sinh nếu để trống" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Giá (₫)</label>
                      <input type="number" className="form-control" value={form.price} onChange={e=>setForm(s=>({...s,price:e.target.value}))} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Tồn kho</label>
                      <input type="number" className="form-control" value={form.stock} onChange={e=>setForm(s=>({...s,stock:e.target.value}))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Danh mục</label>
                      <select className="form-select" value={form.categoryId} onChange={e=>setForm(s=>({...s,categoryId:e.target.value}))}>
                        <option value="">--Chọn danh mục--</option>
                        {categories.map(c => (
                          <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Ảnh (URL)</label>
                      <input className="form-control" value={form.image} onChange={e=>setForm(s=>({...s,image:e.target.value}))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Mô tả</label>
                      <textarea className="form-control" rows={4} value={form.description} onChange={e=>setForm(s=>({...s,description:e.target.value}))} />
                    </div>
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