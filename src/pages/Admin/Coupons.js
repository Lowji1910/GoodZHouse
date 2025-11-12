import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminCoupons() {
  const { notify } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: '', startsAt: '', endsAt: '', usageLimit: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

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
      if (!payload.code || String(payload.code).trim().length < 3) throw new Error('Mã tối thiểu 3 ký tự');
      if (payload.type === 'percent' && (payload.value <= 0 || payload.value > 100)) throw new Error('Phần trăm phải trong (0,100]');
      if (payload.type === 'amount' && payload.value <= 0) throw new Error('Số tiền phải > 0');
      if (payload.startsAt && payload.endsAt && payload.startsAt > payload.endsAt) throw new Error('Thời gian không hợp lệ');
      await api.createCoupon(payload);
      setForm({ code: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: '', startsAt: '', endsAt: '', usageLimit: '', isActive: true });
      await load();
      notify('Đã tạo coupon', 'success');
    } catch (e) {
      notify(e.message || 'Không tạo được coupon', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.updateCoupon(id, { isActive: !isActive });
      await load();
      notify('Đã cập nhật trạng thái', 'success');
    } catch (e) { notify(e.message || 'Lỗi cập nhật', 'danger'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xoá coupon này?')) return;
    try { await api.deleteCoupon(id); await load(); notify('Đã xoá coupon', 'success'); } catch (e) { notify(e.message || 'Lỗi xoá', 'danger'); }
  };

  const filtered = useMemo(() => {
    let arr = list;
    if (q) {
      const t = q.toLowerCase();
      arr = arr.filter(c => String(c.code).toLowerCase().includes(t));
    }
    if (active) arr = arr.filter(c => active === 'active' ? !!c.isActive : !c.isActive);
    if (from) arr = arr.filter(c => (c.startsAt ? new Date(c.startsAt) >= new Date(from) : true));
    if (to) arr = arr.filter(c => (c.endsAt ? new Date(c.endsAt) <= new Date(to) : true));
    return arr;
  }, [list, q, active, from, to]);

  return (
    <div className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="mb-0">Coupons</h3>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <input className="form-control" placeholder="Tìm theo mã..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ maxWidth: 220 }} />
          <select className="form-select" value={active} onChange={(e)=>setActive(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">Tất cả</option>
            <option value="active">Đang bật</option>
            <option value="inactive">Đang tắt</option>
          </select>
          <input type="datetime-local" className="form-control" value={from} onChange={(e)=>setFrom(e.target.value)} />
          <input type="datetime-local" className="form-control" value={to} onChange={(e)=>setTo(e.target.value)} />
          <button className="btn btn-outline-secondary" onClick={()=>{ setQ(''); setActive(''); setFrom(''); setTo(''); }}>Xóa lọc</button>
          <button className="btn btn-primary" onClick={load} disabled={loading}>{loading ? 'Đang tải...' : 'Làm mới'}</button>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        <div className="col-lg-5">
          <form className="card shadow-sm" onSubmit={handleCreate}>
            <div className="card-body">
              <h5 className="mb-3">Tạo coupon</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Mã</label>
                  <input className="form-control" value={form.code} onChange={e=>setForm(s=>({...s, code:e.target.value}))} required minLength={3} />
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
              {loading ? (
                <div className="placeholder-glow py-2">
                  <span className="placeholder col-12"></span>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '70vh' }}>
                  <table className="table table-striped align-middle">
                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Mã</th><th>Loại</th><th>Giá trị</th><th>Min</th><th>Max</th><th>Bắt đầu</th><th>Kết thúc</th><th>Used</th><th>Active</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={10} className="text-center py-5"><div className="text-muted">Không có coupon phù hợp.</div></td></tr>
                      ) : filtered.map(c => (
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
