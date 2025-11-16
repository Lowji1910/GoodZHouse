import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

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
      const params = new URLSearchParams();
      params.set('limit', '8');
      params.set('page', String(p));
      if (query) params.set('q', query);
      if (catFilter) params.set('categoryId', catFilter);
      const response = await fetch(`/api/admin/products?${params.toString()}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
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
      const res = await fetch(`/api/categories`);
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
      await Promise.all(selected.map(id => fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ inStock }) })));
      setSelected([]);
      fetchProducts(page, q);
      notify(`Đã đặt ${inStock ? 'Còn hàng' : 'Hết hàng'} cho ${selected.length} sản phẩm`, 'success');
    } catch (e) { notify(e.message || 'Lỗi cập nhật trạng thái hàng loạt', 'danger'); }
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Xóa ${selected.length} sản phẩm đã chọn?`)) return;
    try {
      await Promise.all(selected.map(id => fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })));
      setSelected([]);
      fetchProducts(page, q);
      notify('Đã xóa các sản phẩm đã chọn', 'success');
    } catch (e) { notify(e.message || 'Lỗi khi xóa sản phẩm', 'danger'); }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/products/import-template`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notify('Tải template thành công!', 'success');
    } catch (e) {
      notify(e.message || 'Lỗi khi tải template', 'danger');
    }
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
      const url = editingId ? `/api/admin/products/${editingId}` : `/api/admin/products`;
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
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!(res.ok || res.status === 204)) throw new Error('HTTP ' + res.status);
      fetchProducts(page, q);
      notify('Đã xóa sản phẩm', 'success');
    } catch (e1) { notify(e1.message || 'Lỗi khi xóa sản phẩm', 'danger'); }
  };

  const isAllSelected = products.length > 0 && selected.length === products.length;

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/products/export`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notify('Xuất file Excel thành công!', 'success');
    } catch (e) {
      notify(e.message || 'Lỗi khi xuất file Excel', 'danger');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/admin/products/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);
      const result = await response.json();

      if (result.success) {
        setShowImport(false);
        fetchProducts(1, q);
        notify(`Nhập thành công ${result.productsImported} sản phẩm!`, 'success');
      } else {
        notify(result.message || 'Lỗi khi nhập file Excel', 'danger');
        if (result.errors && result.errors.length > 0) {
          console.error('Import errors:', result.errors);
        }
      }
    } catch (e) {
      notify(e.message || 'Lỗi khi nhập file Excel', 'danger');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

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
          <button className="btn btn-info" onClick={handleExport}>Export Excel</button>
          <button className="btn btn-success" onClick={()=>setShowImport(true)}>Import Excel</button>
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

      {/* Import Excel Modal */}
      {showImport && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Import Excel</h5>
                <button type="button" className="btn-close" onClick={()=>{setShowImport(false);}}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>Hướng dẫn:</strong>
                  <ol className="mb-0 mt-2">
                    <li>Tải file template mẫu bên dưới</li>
                    <li>Điền thông tin sản phẩm vào file Excel</li>
                    <li>Upload file để nhập dữ liệu</li>
                  </ol>
                </div>
                <div className="mb-3">
                  <button className="btn btn-outline-primary" onClick={handleDownloadTemplate}>
                    📥 Tải Template Mẫu
                  </button>
                </div>
                <div className="mb-3">
                  <label className="form-label">Chọn file Excel để import</label>
                  <input type="file" className="form-control" accept=".xlsx, .xls" onChange={handleImport} disabled={importing} />
                </div>
                {importing && (
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Đang nhập...</span>
                    </div>
                    <p className="mt-2">Đang xử lý file Excel...</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=>{setShowImport(false);}} disabled={importing}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
