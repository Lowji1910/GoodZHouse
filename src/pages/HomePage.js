import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function ProductRow({ title, query }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const load = async () => {
      try {
        setLoading(true); setError('');
        const res = await fetch(`${BASE}/api/products?${query}&_=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!controller.signal.aborted) setItems(data.items || []);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [query]);

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="mb-0">{title}</h4>
        <Link to="/products" className="text-decoration-none">Xem tất cả →</Link>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="d-flex gap-3 overflow-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card shadow-sm" style={{ minWidth: 240 }}>
                <div className="ratio ratio-4x3 bg-light" />
                <div className="card-body">
                  <div className="placeholder-glow">
                    <span className="placeholder col-8" />
                  </div>
                </div>
              </div>
            ))
          : items.map((p) => (
              <div key={p.id} className="card h-100 shadow-sm" style={{ minWidth: 240, scrollSnapAlign: 'start' }}>
                <Link to={`/products/${p.id}`} className="text-decoration-none text-dark">
                  <div className="ratio ratio-4x3 bg-light rounded-top">
                    {p.image && (
                      <img src={p.image} alt={p.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    )}
                  </div>
                </Link>
                <div className="card-body">
                  <Link to={`/products/${p.id}`} className="text-decoration-none text-dark">
                    <h6 className="card-title" style={{ minHeight: 40 }}>{p.name}</h6>
                  </Link>
                  {p.rating > 0 && (
                    <div className="d-flex align-items-center gap-1 mb-2">
                      <span className="badge bg-warning text-dark">{p.rating?.toFixed(1)} ⭐</span>
                      <small className="text-muted">({p.reviewsCount})</small>
                    </div>
                  )}
                  <div className="fw-bold text-danger">{p.price?.toLocaleString('vi-VN')}₫</div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const load = async () => {
      try {
        setLoading(true); setError('');
        const res = await fetch(`${BASE}/api/banners?_=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!(res.ok || res.status === 304)) throw new Error('HTTP ' + res.status);
        if (res.status !== 304) {
          const data = await res.json();
          if (!controller.signal.aborted) setBanners(data || []);
        }
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  return (
    <div className="container px-0">
      {/* Carousel banners */}
      <div id="homeCarousel" className="carousel slide mb-4" data-bs-ride="carousel">
        <div className="carousel-inner rounded shadow-sm">
          {(loading && banners.length === 0) ? (
            <div className="carousel-item active">
              <div className="ratio ratio-16x9 bg-light" />
            </div>
          ) : banners.length === 0 ? (
            <div className="carousel-item active">
              <div className="ratio ratio-16x9 bg-light d-flex align-items-center justify-content-center">
                <div className="text-muted">Chưa có banner</div>
              </div>
            </div>
          ) : (
            banners.map((b, idx) => (
              <div key={b.id} className={`carousel-item ${idx===0? 'active':''}`}>
                {b.linkUrl ? (
                  <a href={b.linkUrl}>
                    <img src={b.imageUrl} className="d-block w-100" alt={b.title || ''} style={{ height: '360px', objectFit: 'cover' }} />
                  </a>
                ) : (
                  <img src={b.imageUrl} className="d-block w-100" alt={b.title || ''} style={{ height: '360px', objectFit: 'cover' }} />
                )}
                {(b.title || b.subtitle) && (
                  <div className="carousel-caption d-none d-md-block text-start">
                    {b.title && <h5 className="fw-bold">{b.title}</h5>}
                    {b.subtitle && <p>{b.subtitle}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {banners.length > 1 && (
          <>
            <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev">
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next">
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Horizontal product sections */}
      <ProductRow title="Hàng mới" query="limit=12" />
      <ProductRow title="Giá tốt hôm nay" query="sort=price_asc&limit=12" />
    </div>
  );
}
