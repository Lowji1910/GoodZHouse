  import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ReviewList from '../components/Review/ReviewList';
import ReviewForm from '../components/Review/ReviewForm';
import { useWishlist } from '../context/WishlistContext';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [notifyOnDiscount, setNotifyOnDiscount] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [imageIndex, setImageIndex] = useState(0);
  const tabContainerRef = useRef(null);
  const tabContentRef = useRef(null);
  
  const { collections, addToWishlist } = useWishlist();
  const { addItem } = useCart();
  const { user } = useAuth();

  // Hide any open Bootstrap modals on route change and clean duplicate backdrops
  useEffect(() => {
    const opened = document.querySelectorAll('.modal.show');
    opened.forEach((el) => {
      if (window.bootstrap) {
        const inst = window.bootstrap.Modal.getInstance(el) || new window.bootstrap.Modal(el);
        inst.hide();
      }
    });
    // Remove ALL backdrops on route change and clear body lock
    document.querySelectorAll('.modal-backdrop').forEach((bd) => bd.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('paddingRight');
  }, [location.pathname]);

  // Register GSAP Flip once
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    gsap.registerPlugin(Flip);
  }, []);

  // Control create-collection modal via Bootstrap API
  useEffect(() => {
    const el = document.getElementById('createCollectionModal');
    if (!el || !window.bootstrap) return;
    const inst = window.bootstrap.Modal.getInstance(el) || new window.bootstrap.Modal(el, { backdrop: true, keyboard: true });
    if (showCreateCollection) inst.show(); else inst.hide();
    const onShown = () => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      if (backdrops.length > 1) backdrops.forEach((bd, idx) => { if (idx < backdrops.length - 1) bd.remove(); });
    };
    const onHidden = () => {
      // If no modal is visible, remove any stray backdrops and body lock
      if (!document.querySelector('.modal.show')) {
        document.querySelectorAll('.modal-backdrop').forEach((bd) => bd.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('paddingRight');
      }
    };
    el.addEventListener('shown.bs.modal', onShown);
    el.addEventListener('hidden.bs.modal', onHidden);
    return () => {
      el.removeEventListener('shown.bs.modal', onShown);
      el.removeEventListener('hidden.bs.modal', onHidden);
    };
  }, [showCreateCollection]);

  // Cleanup duplicate backdrops when addToWishlistModal is shown
  useEffect(() => {
    const el = document.getElementById('addToWishlistModal');
    if (!el) return;
    const onShown = () => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      if (backdrops.length > 1) backdrops.forEach((bd, idx) => { if (idx < backdrops.length - 1) bd.remove(); });
    };
    const onHidden = () => {
      if (!document.querySelector('.modal.show')) {
        document.querySelectorAll('.modal-backdrop').forEach((bd) => bd.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('paddingRight');
      }
    };
    el.addEventListener('shown.bs.modal', onShown);
    el.addEventListener('hidden.bs.modal', onHidden);
    return () => {
      el.removeEventListener('shown.bs.modal', onShown);
      el.removeEventListener('hidden.bs.modal', onHidden);
    };
  }, []);

  // Animate tab changes using Flip
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const state = Flip.getState(tabContentRef.current);
    // Force reflow by toggling a data attribute to hint layout change
    tabContentRef.current?.setAttribute('data-flip', activeTab);
    Flip.from(state, { duration: 0.4, ease: 'power2.out' });
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE}/api/products/slug/${slug}`, {
          signal: controller.signal
        });
        
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        
        if (isMounted) {
          setProduct(data);
          setError('');
        }
      } catch (error) {
        // Fallback: if slug fetch fails, try treating the param as an ID
        if (error.name !== 'AbortError' && isMounted) {
          try {
            const respById = await fetch(`${BASE}/api/products/${slug}`, { signal: controller.signal });
            if (!respById.ok) throw new Error('HTTP ' + respById.status);
            const dataById = await respById.json();
            if (isMounted) {
              setProduct(dataById);
              setError('');
              // Redirect to canonical slug URL if available
              if (dataById.slug && location.pathname !== `/products/${dataById.slug}`) {
                navigate(`/products/${dataById.slug}`, { replace: true });
              }
            }
          } catch (e2) {
            if (isMounted) {
              setError(error.message);
              setProduct(null);
            }
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [slug]);

  // Load related products by first category
  useEffect(() => {
    const loadRelated = async () => {
      if (!product || !Array.isArray(product.categoryIds) || product.categoryIds.length === 0) {
        setRelated([]);
        return;
      }
      try {
        setLoadingRelated(true);
        const catId = product.categoryIds[0];
        const res = await fetch(`${BASE}/api/products?category=${catId}&limit=8`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const items = (data.items || []).filter(p => p.id !== product._id);
        setRelated(items);
      } catch (e) {
        setRelated([]);
      } finally {
        setLoadingRelated(false);
      }
    };
    loadRelated();
  }, [product]);

  const handleReviewSubmit = async (review) => {
    try {
      const response = await fetch(`${BASE}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({
          ...review,
          productId: product._id,
        }),
      });
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      // Refresh the product to update rating
      const productResponse = await fetch(`${BASE}/api/products/slug/${slug}`);
      if (!productResponse.ok) throw new Error('HTTP ' + productResponse.status);
      setProduct(await productResponse.json());
    } catch (err) {
      alert('Lỗi khi gửi đánh giá: ' + err.message);
    }
  };

  if (loading) return <div className="container py-4">Đang tải...</div>;
  if (error || !product) return <div className="container py-4 text-danger">Lỗi: {error || 'Không tìm thấy sản phẩm'}</div>;

  const images = Array.isArray(product.images) ? product.images : [];
  const cover = images.length ? images[Math.max(0, Math.min(imageIndex, images.length - 1))] : undefined;

  return (
    <div className="container py-4">
      <div className="row g-4 align-items-start">
        <div className="col-md-6">
          <div className="border rounded p-2 shadow-sm">
            {cover ? (
              <div className="bg-light rounded overflow-hidden" style={{ aspectRatio: '3 / 2' }}>
                <img src={cover} alt={product.name} className="w-100 h-100" style={{ objectFit: 'cover', display: 'block' }} />
              </div>
            ) : (
              <div className="bg-light rounded" style={{ aspectRatio: '3 / 2' }} />
            )}
          </div>
          {images.length > 1 && (
            <div className="d-flex gap-2 mt-2">
              {images.slice(0, 6).map((img, idx) => (
                <button
                  key={idx}
                  className={`btn p-0 border-0 ${idx === imageIndex ? 'opacity-100' : 'opacity-75'}`}
                  style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden' }}
                  onClick={() => setImageIndex(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                >
                  <div className="bg-light" style={{ width: '100%', height: '100%' }}>
                    <img src={img} alt="thumb" className="w-100 h-100" style={{ objectFit: 'cover', display: 'block' }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="col-md-6">
          <div className="mb-3 position-sticky" style={{ top: 88 }}>
            <h3 className="text-start">{product.name}</h3>
            <div className="text-danger h5">{(product.price || 0).toLocaleString('vi-VN')}₫</div>
            {product.shortDescription && <p className="text-muted mb-0 text-start">{product.shortDescription}</p>}
          </div>
          
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="badge bg-warning text-dark fs-6">
              {product.rating?.toFixed(1) || '0.0'} ⭐
            </span>
            <span className="text-muted">
              ({product.reviewsCount || 0} đánh giá)
            </span>
          </div>

          <div className="d-flex gap-2 mb-4">
            {user && (
              <button 
                className="btn btn-success"
                onClick={() => {
                  addItem({ id: product._id, name: product.name, price: product.price, image: cover }, 1);
                  const el = document.getElementById('offcanvasCart');
                  const bs = window.bootstrap;
                  if (el && bs) {
                    const inst = bs.Offcanvas.getInstance(el) || new bs.Offcanvas(el, { backdrop: true, scroll: true });
                    inst.show();
                  }
                }}
              >
                Thêm vào giỏ hàng
              </button>
            )}
            <button 
              className="btn btn-primary"
              onClick={() => addToWishlist(product._id)}
            >
              ❤️ Thêm vào yêu thích
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={() => {
                const el = document.getElementById('addToWishlistModal');
                const bs = window.bootstrap;
                if (el && bs) {
                  const inst = bs.Modal.getInstance(el) || new bs.Modal(el, { backdrop: true, keyboard: true });
                  inst.show();
                }
              }}
            >
              Thêm vào bộ sưu tập
            </button>
          </div>

          {/* Add to Wishlist Modal (standard Bootstrap) */}
          <div className="modal fade" id="addToWishlistModal" tabIndex="-1" aria-hidden="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Thêm vào bộ sưu tập</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" />
                </div>
                <div className="modal-body">
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="notifyDiscount"
                      checked={notifyOnDiscount}
                      onChange={(e) => setNotifyOnDiscount(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="notifyDiscount">
                      Thông báo khi giảm giá
                    </label>
                  </div>
                  
                  <div className="list-group">
                    {collections.map((collection) => (
                      <button
                        key={collection._id}
                        className="list-group-item list-group-item-action"
                        onClick={() => {
                          addToWishlist(product.id, collection._id, notifyOnDiscount);
                          const el = document.getElementById('addToWishlistModal');
                          if (el && window.bootstrap) {
                            const inst = window.bootstrap.Modal.getInstance(el);
                            if (inst) inst.hide();
                          }
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">{collection.name}</h6>
                          <small className="text-muted">
                            {collection.items?.length || 0} sản phẩm
                          </small>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button className="btn btn-outline-primary w-100 mt-3" onClick={() => {
                    const addEl = document.getElementById('addToWishlistModal');
                    if (addEl && window.bootstrap) {
                      const addInst = window.bootstrap.Modal.getInstance(addEl);
                      if (addInst) addInst.hide();
                    }
                    setShowCreateCollection(true);
                  }}>+ Tạo bộ sưu tập mới</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5 g-4">
        <div className="col-lg-8">
          {/* Tabs Header */}
          <div className="d-flex gap-3 border-bottom" ref={tabContainerRef}>
            <button className={`btn btn-link text-decoration-none ${activeTab==='description' ? 'text-dark' : 'text-muted'}`} onClick={() => setActiveTab('description')}>
              Mô tả
            </button>
            {product.specs && (
              <button className={`btn btn-link text-decoration-none ${activeTab==='specs' ? 'text-dark' : 'text-muted'}`} onClick={() => setActiveTab('specs')}>
                Thông số
              </button>
            )}
            <button className={`btn btn-link text-decoration-none ${activeTab==='reviews' ? 'text-dark' : 'text-muted'}`} onClick={() => setActiveTab('reviews')}>
              Đánh giá
            </button>
          </div>

          {/* Tabs Content */}
          <div ref={tabContentRef} className="mt-3" data-flip={activeTab}>
            {activeTab === 'description' && (
              <div className="card">
                <div className="card-body text-start">
                  {product.description || 'Chưa có mô tả cho sản phẩm này.'}
                </div>
              </div>
            )}

            {activeTab === 'specs' && product.specs && (
              <div className="card">
                <div className="card-body text-start">
                  {typeof product.specs === 'string' ? product.specs : JSON.stringify(product.specs, null, 2)}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="mb-3">
                  <h5 className="mb-2 text-start">Viết đánh giá</h5>
                  <ReviewForm onSubmit={handleReviewSubmit} />
                </div>
                <div className="mb-3">
                  <h5 className="mb-2 text-start">Đánh giá sản phẩm</h5>
                  <ReviewList productId={product._id} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          {related.length > 0 && (
            <div>
              <h5 className="mb-3 text-start">Sản phẩm liên quan</h5>
              <div className="d-flex flex-column gap-3">
                {related.map((p) => (
                  <div className="card shadow-sm" key={p.id}>
                    <Link to={`/products/${p.slug || p.id}`} className="text-decoration-none text-dark">
                      <div className="row g-0 align-items-center">
                        <div className="col-4">
                          <div className="ratio ratio-1x1 bg-light rounded-start">
                            {p.image && (
                              <img src={p.image} alt={p.name} className="w-100 h-100 rounded-start" style={{ objectFit: 'cover' }} />
                            )}
                          </div>
                        </div>
                        <div className="col-8">
                          <div className="card-body">
                            <h6 className="card-title mb-1 text-start" style={{ minHeight: 40 }}>{p.name}</h6>
                            <div className="fw-bold text-danger text-start">{(p.price||0).toLocaleString('vi-VN')}₫</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Collection Modal (controlled by Bootstrap API) */}
      <div className="modal fade" id="createCollectionModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Tạo bộ sưu tập mới</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={() => setShowCreateCollection(false)}></button>
            </div>
            <div className="modal-body">
              {/* Add collection creation form here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}