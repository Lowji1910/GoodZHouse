import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

export default function AdminCoupons() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: '', startsAt: '', endsAt: '', usageLimit: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const data = await api.listCoupons();
      setList(data);
    } catch (e) {
      setError(e.message || 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: form.maxDiscount === '' ? undefined : Number(form.maxDiscount),
        startsAt: form.startsAt ? new Date(form.startsAt) : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt) : undefined,
        usageLimit: form.usageLimit === '' ? undefined : Number(form.usageLimit),
      };
      await api.createCoupon(payload);
      setForm({ code: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: '', startsAt: '', endsAt: '', usageLimit: '', isActive: true });
      await load();
    } catch (e) {
      alert(e.message || 'Không tạo được coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.updateCoupon(id, { isActive: !isActive });
      await load();
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xoá coupon này?')) return;
    try { await api.deleteCoupon(id); await load(); } catch (e) { alert(e.message); }
  };

  return (
    <div className="py-3">
      <h3>Coupons</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        <div className="col-lg-5">
          <form className="card shadow-sm" onSubmit={handleCreate}>
            <div className="card-body">
              <h5 className="mb-3">Tạo coupon</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Mã</label>
                  <input className="form-control" value={form.code} onChange={e=>setForm(s=>({...s, code:e.target.value}))} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Loại</label>
                  <select className="form-select" value={form.type} onChange={e=>setForm(s=>({...s, type:e.target.value}))}>
                    <option value="percent">Phần trăm (%)</option>
                    <option value="amount">Số tiền (₫)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Giá trị</label>
                  <input type="number" className="form-control" value={form.value} onChange={e=>setForm(s=>({...s, value:e.target.value}))} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Đơn tối thiểu</label>
                  <input type="number" className="form-control" value={form.minOrder} onChange={e=>setForm(s=>({...s, minOrder:e.target.value}))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Giảm tối đa</label>
                  <input type="number" className="form-control" value={form.maxDiscount} onChange={e=>setForm(s=>({...s, maxDiscount:e.target.value}))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Giới hạn lượt</label>
                  <input type="number" className="form-control" value={form.usageLimit} onChange={e=>setForm(s=>({...s, usageLimit:e.target.value}))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Bắt đầu</label>
                  <input type="datetime-local" className="form-control" value={form.startsAt} onChange={e=>setForm(s=>({...s, startsAt:e.target.value}))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Kết thúc</label>
                  <input type="datetime-local" className="form-control" value={form.endsAt} onChange={e=>setForm(s=>({...s, endsAt:e.target.value}))} />
                </div>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end">
              <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang tạo...' : 'Tạo'}</button>
            </div>
          </form>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách</h5>
              {loading ? <div>Đang tải...</div> : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Mã</th><th>Loại</th><th>Giá trị</th><th>Min</th><th>Max</th><th>Bắt đầu</th><th>Kết thúc</th><th>Used</th><th>Active</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(c => (
                        <tr key={c.id}>
                          <td className="fw-semibold">{c.code}</td>
                          <td>{c.type}</td>
                          <td>{c.type==='percent' ? c.value + '%' : c.value?.toLocaleString('vi-VN') + '₫'}</td>
                          <td>{(c.minOrder||0).toLocaleString('vi-VN')}₫</td>
                          <td>{c.maxDiscount ? c.maxDiscount.toLocaleString('vi-VN') + '₫' : '-'}</td>
                          <td>{c.startsAt ? new Date(c.startsAt).toLocaleString('vi-VN') : '-'}</td>
                          <td>{c.endsAt ? new Date(c.endsAt).toLocaleString('vi-VN') : '-'}</td>
                          <td>{c.usedCount || 0}/{c.usageLimit || '-'}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input className="form-check-input" type="checkbox" checked={!!c.isActive} onChange={()=>toggleActive(c.id, c.isActive)} />
                            </div>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(c.id)}>Xoá</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
