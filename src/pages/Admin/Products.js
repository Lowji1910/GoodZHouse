import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function AdminProducts() {
  const { notify } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', price: '', stock: '', image: '', categoryId: '', description: '' });

  const [selected, setSelected] = useState([]); // product ids
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

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
      if (catFilter) url.searchParams.set('categoryId', catFilter);
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

  const toggleSelect = (id) => setSelected((arr) => arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);
  const toggleSelectAll = () => {
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map(p=>p.id));
  };

  const bulkUpdateStock = async (inStock) => {
    if (selected.length === 0) return;
    try {
      await Promise.all(selected.map(id => fetch(`${BASE}/api/admin/products/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ inStock }) })));
      setSelected([]);
      fetchProducts(page, q);
      notify(`Đã đặt ${inStock ? 'Còn hàng' : 'Hết hàng'} cho ${selected.length} sản phẩm`, 'success');
    } catch (e) { notify(e.message || 'Lỗi cập nhật trạng thái hàng loạt', 'danger'); }
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Xóa ${selected.length} sản phẩm đã chọn?`)) return;
    try {
      await Promise.all(selected.map(id => fetch(`${BASE}/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })));
      setSelected([]);
      fetchProducts(page, q);
      notify('Đã xóa các sản phẩm đã chọn', 'success');
    } catch (e) { notify(e.message || 'Lỗi khi xóa sản phẩm', 'danger'); }
  };

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
      notify(editingId ? 'Cập nhật sản phẩm thành công' : 'Tạo sản phẩm thành công', 'success');
    } catch (e1) { notify(e1.message || 'Lỗi khi lưu sản phẩm', 'danger'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`${BASE}/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!(res.ok || res.status === 204)) throw new Error('HTTP ' + res.status);
      fetchProducts(page, q);
      notify('Đã xóa sản phẩm', 'success');
    } catch (e1) { notify(e1.message || 'Lỗi khi xóa sản phẩm', 'danger'); }
  };

  const isAllSelected = products.length > 0 && selected.length === products.length;

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">Quản lý sản phẩm</h2>
        <form className="d-flex flex-wrap align-items-center gap-2" onSubmit={onSearch}>
          <input className="form-control" placeholder="Tìm sản phẩm..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ maxWidth: 240 }} />
          <select className="form-select" value={catFilter} onChange={(e)=>{ setCatFilter(e.target.value); fetchProducts(1, q); }} style={{ maxWidth: 220 }}>
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (<option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>))}
          </select>
          <button className="btn btn-outline-primary">Lọc</button>
        </form>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-secondary" disabled={selected.length===0} onClick={()=>bulkUpdateStock(true)}>Đặt Còn hàng</button>
          <button className="btn btn-outline-secondary" disabled={selected.length===0} onClick={()=>bulkUpdateStock(false)}>Đặt Hết hàng</button>
          <button className="btn btn-outline-danger" disabled={selected.length===0} onClick={bulkDelete}>Xóa đã chọn</button>
          <button className="btn btn-success" onClick={()=>setShowImport(true)}>Import CSV</button>
          <button className="btn btn-primary" onClick={startCreate}>Thêm sản phẩm</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-responsive" style={{ maxHeight: '70vh' }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{width:40}}>
                  <input type="checkbox" className="form-check-input" checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={7}>
                    <div className="placeholder-glow">
                      <span className="placeholder col-2 me-2"></span>
                      <span className="placeholder col-3 me-2"></span>
                      <span className="placeholder col-2 me-2"></span>
                      <span className="placeholder col-2 me-2"></span>
                    </div>
                  </td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5"><div className="text-muted">Không có sản phẩm phù hợp.</div></td></tr>
              ) : (
                products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <input type="checkbox" className="form-check-input" checked={selected.includes(product.id)} onChange={()=>toggleSelect(product.id)} />
                    </td>
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

      {/* Import CSV Modal */}
      {showImport && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Import CSV</h5>
                <button type="button" className="btn-close" onClick={()=>{setShowImport(false); setImportText('');}}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted">Dán dữ liệu CSV theo cột: name,price,stock,image,categoryId,description</p>
                <textarea className="form-control" rows={10} value={importText} onChange={(e)=>setImportText(e.target.value)} placeholder="Ví dụ:\nGhế Sofa,3500000,10,https://.../sofa.jpg,64f...,Sofa vải cao cấp"></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=>{setShowImport(false); setImportText('');}}>Hủy</button>
                <button className="btn btn-success" disabled={importing || !importText.trim()} onClick={async ()=>{
                  try {
                    setImporting(true);
                    const lines = importText.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
                    for (const line of lines) {
                      const parts = line.split(',');
                      const [name, price, stock, image, categoryId, ...descParts] = parts;
                      const description = descParts.join(',').trim();
                      const payload = {
                        name: (name||'').trim(),
                        price: Number(price)||0,
                        stock: Number(stock)||0,
                        images: image ? [image.trim()] : [],
                        categoryIds: categoryId ? [categoryId.trim()] : [],
                        description
                      };
                      await fetch(`${BASE}/api/admin/products`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
                    }
                    setShowImport(false); setImportText('');
                    fetchProducts(1, q);
                  } catch (e) { alert(e.message); } finally { setImporting(false); }
                }}>{importing ? 'Đang import...' : 'Import'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}