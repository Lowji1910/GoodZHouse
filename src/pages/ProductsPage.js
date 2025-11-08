import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductSkeleton from '../components/Shared/ProductSkeleton';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [params, setParams] = useSearchParams();
  const { addItem } = useCart();

  const observer = useRef();
  const abortControllerRef = useRef();
  const loadingRef = useRef(false);
  const lastProductRef = useCallback(node => {
    if (loading || !node || !hasMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1);
      }
    }, {
      threshold: 0.5,
      rootMargin: '100px'
    });
    
    observer.current.observe(node);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore]);

  const buildQuery = useCallback((currentPage) => {
    const searchParams = new URLSearchParams();
    searchParams.append('page', currentPage);
    searchParams.append('limit', 12);
    
    // Category: pass through as-is (use slug in dropdown)
    const categoryValue = params.get('category');
    if (categoryValue) {
      searchParams.append('category', categoryValue);
    }
    
    // Các params khác
    ['q', 'sort', 'min', 'max'].forEach(param => {
      const value = params.get(param);
      if (value) {
        searchParams.append(param === 'q' ? 'search' : param, value);
      }
    });

    return searchParams.toString();
  }, [params]);

  const fetchProducts = useCallback(async (currentPage, replace = false) => {
    if (loadingRef.current) return;
    
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      loadingRef.current = true;
      setLoading(true);
      setError('');
      
      const queryString = buildQuery(currentPage);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/products?${queryString}`,
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();

      if (!controller.signal.aborted) {
        setProducts(prev => replace ? data.items : [...prev, ...data.items]);
        setHasMore(data.page < data.pages);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setHasMore(false);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [buildQuery]);

  // Effect for params change - reset page & load new data
  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/categories`);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Effect for params change - reset page & load new data  
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Effect for page change - load more products
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const currentParams = Object.fromEntries(params);
      setParams({ ...currentParams, q: e.currentTarget.value, page: '1' });
    }
  };

  const handleFilterChange = (key, value) => {
    const currentParams = Object.fromEntries(params);
    setParams({ ...currentParams, [key]: value, page: '1' });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Sản phẩm</h2>
      <div className="d-flex gap-2 align-items-center mb-3 flex-wrap">
        <select
          className="form-select"
          style={{ maxWidth: 200 }}
          value={params.get('category') || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat._id} value={encodeURIComponent(cat.slug || cat.name)}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="Tìm kiếm..."
          defaultValue={params.get('q') || ''}
          onKeyDown={handleSearch}
        />
        <input
          type="number"
          className="form-control"
          style={{ maxWidth: 160 }}
          placeholder="Giá từ"
          defaultValue={params.get('min') || ''}
          onBlur={(e) => handleFilterChange('min', e.currentTarget.value)}
        />
        <input
          type="number"
          className="form-control"
          style={{ maxWidth: 160 }}
          placeholder="Giá đến"
          defaultValue={params.get('max') || ''}
          onBlur={(e) => handleFilterChange('max', e.currentTarget.value)}
        />
        <select
          className="form-select"
          style={{ maxWidth: 200 }}
          value={params.get('sort') || ''}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
        >
          <option value="">Mới nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        {products.map((p, index) => (
          <div 
            className="col-6 col-md-3" 
            key={p.id}
            ref={index === products.length - 1 ? lastProductRef : null}
          >
            <div className="card h-100 shadow-sm">
              <Link to={`/products/${p.slug || p.id}`} className="text-decoration-none text-dark">
                <div className="ratio ratio-4x3 bg-light rounded-top">
                  {p.image && (
                    <img src={p.image} alt={p.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                  )}
                </div>
              </Link>
              <div className="card-body d-flex flex-column">
                <Link to={`/products/${p.slug || p.id}`} className="text-decoration-none text-dark">
                  <h6 className="card-title" style={{ minHeight: 40 }}>{p.name}</h6>
                </Link>
                {p.rating > 0 && (
                  <div className="d-flex align-items-center gap-1 mb-2">
                    <span className="badge bg-warning text-dark">
                      {p.rating?.toFixed(1)} ⭐
                    </span>
                    <small className="text-muted">
                      ({p.reviewsCount})
                    </small>
                  </div>
                )}
                <div className="fw-bold text-danger mb-2">{p.price?.toLocaleString('vi-VN')}₫</div>
                <button 
                  className="btn btn-sm btn-primary mt-auto" 
                  onClick={() => addItem(p, 1)} 
                  data-bs-toggle="offcanvas" 
                  data-bs-target="#offcanvasCart"
                >
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Loading skeletons */}
        {loading && Array(4).fill(0).map((_, i) => (
          <div className="col-6 col-md-3" key={`skeleton-${i}`}>
            <ProductSkeleton />
          </div>
        ))}
      </div>

      {!loading && !hasMore && products.length > 0 && (
        <p className="text-center text-muted mt-4">Đã hiển thị tất cả sản phẩm</p>
      )}

      {!loading && products.length === 0 && !error && (
        <p className="text-center text-muted mt-4">Không tìm thấy sản phẩm nào</p>
      )}
    </div>
  );
}

