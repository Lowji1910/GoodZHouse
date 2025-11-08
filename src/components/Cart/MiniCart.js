import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function MiniCart() {
  const location = useLocation();
  const { items, total, updateQty, removeItem, clear } = useCart();

  useEffect(() => {
    // Hide offcanvas on route change to avoid stacking weird states
    const el = document.getElementById('offcanvasCart');
    if (!el || !window.bootstrap) return;
    const inst = window.bootstrap.Offcanvas.getInstance(el);
    if (inst) inst.hide();
  }, [location.pathname]);

  useEffect(() => {
    // Remove duplicate backdrops if any (defensive)
    const handler = () => {
      const backdrops = document.querySelectorAll('.offcanvas-backdrop');
      if (backdrops.length > 1) {
        // keep the last one
        backdrops.forEach((bd, idx) => { if (idx < backdrops.length - 1) bd.remove(); });
      }
    };
    document.addEventListener('shown.bs.offcanvas', handler);
    return () => document.removeEventListener('shown.bs.offcanvas', handler);
  }, []);

  return (
    <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasCart" aria-labelledby="offcanvasCartLabel" data-bs-backdrop="true" data-bs-scroll="true">
      <div className="offcanvas-header">
        <h5 className="offcanvas-title" id="offcanvasCartLabel">Giỏ hàng</h5>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div className="offcanvas-body">
        {items.length === 0 && <p className="text-muted">Chưa có sản phẩm.</p>}
        {items.map((it) => (
          <div key={it.id} className="d-flex align-items-center mb-3">
            {it.image && <img alt={it.name} src={it.image} style={{ width: 48, height: 48, objectFit: 'cover' }} className="rounded me-2" />}
            <div className="flex-grow-1">
              <div className="fw-semibold small" title={it.name}>{it.name}</div>
              <div className="text-danger small">{(it.price || 0).toLocaleString('vi-VN')}₫</div>
              <div className="d-flex align-items-center gap-2 mt-1">
                <input type="number" min="1" value={it.quantity} className="form-control form-control-sm" style={{ width: 72 }} onChange={(e) => updateQty(it.id, Number(e.target.value) || 1)} />
                <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(it.id)}>Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="offcanvas-footer border-top p-3">
        <div className="d-flex justify-content-between mb-2">
          <span>Tổng cộng</span>
          <strong className="text-danger">{total.toLocaleString('vi-VN')}₫</strong>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary w-50" onClick={clear}>Xóa hết</button>
          <a className="btn btn-primary w-50" href="/checkout">Thanh toán</a>
        </div>
      </div>
    </div>
  );
}

