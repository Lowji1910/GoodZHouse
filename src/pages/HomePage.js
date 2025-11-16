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
        const url = query === 'on-sale'
          ? `${BASE}/api/products/on-sale`
          : `${BASE}/api/products?${query}&_=${Date.now()}`;
        const res = await fetch(url, {
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
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [homeCategories, setHomeCategories] = useState([]);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const load = async () => {
      try {
        setLoadingBanners(true);
        setError('');
        const [bannersRes, settingsRes, categoriesRes] = await Promise.all([
          fetch(`${BASE}/api/banners?_=${Date.now()}`, { signal: controller.signal, cache: 'no-store' }),
          fetch(`${BASE}/api/settings/homepageCategories`, { signal: controller.signal, cache: 'no-store' }),
          fetch(`${BASE}/api/categories`, { signal: controller.signal, cache: 'no-store' })
        ]);

        if (!bannersRes.ok) throw new Error('Failed to fetch banners');
        setBanners(await bannersRes.json());

        if (settingsRes.ok && categoriesRes.ok) {
          const settings = await settingsRes.json();
          const allCategories = await categoriesRes.json();
          const selectedCats = allCategories.filter(cat => settings.categoryIds.includes(cat._id));
          setHomeCategories(selectedCats);
        }

      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      } finally {
        if (!controller.signal.aborted) setLoadingBanners(false);
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
          {loadingBanners ? (
            <div className="carousel-item active"><div className="ratio ratio-16x9 bg-light" /></div>
          ) : banners.length === 0 ? (
            <div className="carousel-item active">
              <div className="ratio ratio-16x9 bg-light d-flex align-items-center justify-content-center">
                <div className="text-muted">Chưa có banner</div>
              </div>
            </div>
          ) : (
            banners.map((b, idx) => (
              <div key={b.id} className={`carousel-item ${idx === 0 ? 'active' : ''}`}>
                <a href={b.linkUrl || '#'}><img src={b.imageUrl} className="d-block w-100" alt={b.title || ''} style={{ height: '360px', objectFit: 'cover' }} /></a>
              </div>
            ))
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Horizontal product sections */}
      <ProductRow title="Hàng mới" query="limit=12" />
      <ProductRow title="Sản phẩm Giảm giá" query="on-sale" />
      {homeCategories.map(cat => (
        <ProductRow key={cat._id} title={cat.name} query={`category=${cat._id}&limit=12`} />
      ))}
    </div>
  );
}
