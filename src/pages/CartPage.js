import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { items, updateQty, removeItem, clear, total } = useCart();
  const navigate = useNavigate();

  return (
    <div className="container py-4">
      <h2 className="mb-4">Giỏ hàng</h2>
      {items.length === 0 ? (
        <div className="alert alert-info">Giỏ hàng của bạn đang trống.</div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="list-group list-group-flush">
                {items.map((it) => (
                  <div key={it.id} className="list-group-item">
                    <div className="d-flex align-items-center gap-3">
                      {it.image && (
                        <img
                          src={it.image}
                          alt={it.name}
                          width={72}
                          height={72}
                          className="rounded"
                          style={{ objectFit: 'cover' }}
                        />
                      )}
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-semibold">{it.name}</div>
                            <div className="text-danger">{(it.price||0).toLocaleString('vi-VN')}₫</div>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeItem(it.id)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <span className="text-muted">Số lượng:</span>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            style={{ width: 100 }}
                            value={it.quantity}
                            onChange={(e) => updateQty(it.id, Math.max(1, Number(e.target.value)||1))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-outline-danger" onClick={clear}>Xóa tất cả</button>
              <button className="btn btn-secondary" onClick={() => navigate('/products')}>Tiếp tục mua sắm</button>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="mb-3">Tóm tắt đơn hàng</h5>
                <div className="d-flex justify-content-between">
                  <div>Tạm tính</div>
                  <div>{total.toLocaleString('vi-VN')}₫</div>
                </div>
                <hr />
                <button
                  className="btn btn-primary w-100"
                  onClick={() => navigate('/checkout')}
                >
                  Thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

