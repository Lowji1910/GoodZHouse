import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export default function CheckoutPage() {
  const { items, total } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    note: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null); // {code, discount, total}
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const canSubmit = useMemo(() => items.length > 0 && shipping.fullName && shipping.phone && shipping.address && shipping.city, [items.length, shipping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payloadItems = items.map(it => ({ productId: it.id, quantity: it.quantity, price: it.price }));
      const resp = await api.createOrder({ items: payloadItems, paymentMethod, shipping, couponCode: couponApplied?.code || undefined });
      navigate(`/payment/${resp.id}`);
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    setError('');
    try {
      const info = await api.validateCoupon({ code: couponCode, subtotal: total });
      setCouponApplied(info);
    } catch (e) {
      setCouponApplied(null);
      setError(e.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3 text-start">Thanh toán</h2>
      {items.length === 0 && <div className="alert alert-warning">Giỏ hàng đang trống.</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4 align-items-start">
        <div className="col-lg-8">
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="mb-3 text-start">Thông tin giao hàng</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Họ và tên</label>
                    <input className="form-control" value={shipping.fullName} onChange={e=>setShipping(s=>({...s, fullName:e.target.value}))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Số điện thoại</label>
                    <input className="form-control" value={shipping.phone} onChange={e=>setShipping(s=>({...s, phone:e.target.value}))} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Địa chỉ</label>
                    <input className="form-control" value={shipping.address} onChange={e=>setShipping(s=>({...s, address:e.target.value}))} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Tỉnh/Thành phố</label>
                    <input className="form-control" value={shipping.city} onChange={e=>setShipping(s=>({...s, city:e.target.value}))} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Ghi chú (tuỳ chọn)</label>
                    <textarea className="form-control" rows={3} value={shipping.note} onChange={e=>setShipping(s=>({...s, note:e.target.value}))} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="mb-3 text-start">Mã giảm giá</h5>
                <div className="row g-2 align-items-center">
                  <div className="col-sm-8">
                    <input className="form-control" placeholder="Nhập mã giảm giá" value={couponCode} onChange={e=>setCouponCode(e.target.value)} />
                  </div>
                  <div className="col-sm-4 d-grid">
                    <button type="button" className="btn btn-outline-primary" onClick={applyCoupon} disabled={applyingCoupon || !couponCode}>
                      {applyingCoupon ? 'Đang áp dụng...' : 'Áp dụng'}
                    </button>
                  </div>
                </div>
                {couponApplied && (
                  <div className="alert alert-success py-2 mt-3 mb-0">
                    Đã áp dụng mã <strong>{couponApplied.code}</strong>: Giảm <strong>{couponApplied.discount.toLocaleString('vi-VN')}₫</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="mb-3 text-start">Phương thức thanh toán</h5>
                <div className="row g-2">
                  <div className="col-md-4">
                    <label className={`w-100 btn ${paymentMethod==='cod' ? 'btn-warning' : 'btn-outline-secondary'}`}>
                      <input type="radio" className="btn-check" name="pm" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} />
                      COD
                    </label>
                  </div>
                  <div className="col-md-4">
                    <label className={`w-100 btn ${paymentMethod==='momo' ? 'btn-warning' : 'btn-outline-secondary'}`}>
                      <input type="radio" className="btn-check" name="pm" checked={paymentMethod==='momo'} onChange={()=>setPaymentMethod('momo')} />
                      MoMo
                    </label>
                  </div>
                  <div className="col-md-4">
                    <label className={`w-100 btn ${paymentMethod==='vnpay' ? 'btn-warning' : 'btn-outline-secondary'}`}>
                      <input type="radio" className="btn-check" name="pm" checked={paymentMethod==='vnpay'} onChange={()=>setPaymentMethod('vnpay')} />
                      VNPAY
                    </label>
                  </div>
                </div>
              </div>
              <div className="card-footer d-flex justify-content-end gap-2">
                <button className="btn btn-primary" type="submit" disabled={!canSubmit || submitting || items.length===0}>
                  {submitting ? 'Đang tạo đơn hàng...' : 'Đặt hàng'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm" style={{ position: 'sticky', top: 88 }}>
            <div className="card-body">
              <h5 className="mb-3 text-start">Đơn hàng của bạn</h5>
              <ul className="list-group list-group-flush">
                {items.map(it => (
                  <li key={it.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      {it.image && <img src={it.image} alt={it.name} width={40} height={40} style={{objectFit:'cover'}} className="rounded" />}
                      <div>
                        <div className="fw-semibold text-start">{it.name}</div>
                        <small className="text-muted">x{it.quantity}</small>
                      </div>
                    </div>
                    <div className="text-end">
                      {(it.price * it.quantity).toLocaleString('vi-VN')}₫
                    </div>
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-between mt-3">
                <div>Tạm tính</div>
                <div>{total.toLocaleString('vi-VN')}₫</div>
              </div>
              {couponApplied && (
                <div className="d-flex justify-content-between mt-1 text-success">
                  <div>Giảm ({couponApplied.code})</div>
                  <div>-{couponApplied.discount.toLocaleString('vi-VN')}₫</div>
                </div>
              )}
              <div className="d-flex justify-content-between mt-2">
                <div className="fw-bold">Tổng tiền</div>
                <div className="fw-bold text-danger">{(couponApplied ? couponApplied.total : total).toLocaleString('vi-VN')}₫</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
