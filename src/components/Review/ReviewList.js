import { useState, useEffect, useCallback, useRef } from 'react';
import StarFilter from './StarFilter';
import RatingDistribution from './RatingDistribution';
import ReviewImageGallery from './ReviewImageGallery';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ReviewList({ productId }) {
  const [reviews, setReviews] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starFilter, setStarFilter] = useState(0);
  const [sort, setSort] = useState('-createdAt');
  const [stats, setStats] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const abortController = useRef(null);

  const fetchStats = useCallback(async () => {
    if (abortController.current) {
      abortController.current.abort();
    }

    const controller = new AbortController();
    abortController.current = controller;

    try {
      const response = await fetch(
        `${baseUrl}/api/reviews/stats/${productId}`,
        {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (controller.signal.aborted) return;

      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();

      if (!controller.signal.aborted) {
        setStats(data);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch review stats:', err);
      }
    } finally {
      if (abortController.current === controller) {
        abortController.current = null;
      }
    }
  }, [productId, baseUrl]);

  const fetchReviews = useCallback(async (page = 1) => {
    if (abortController.current) {
      abortController.current.abort();
    }

    const controller = new AbortController();
    abortController.current = controller;

    try {
      setLoading(true);
      const response = await fetch(
        `${baseUrl}/api/reviews?productId=${productId}${starFilter ? `&rating=${starFilter}` : ''}&sort=${sort}&page=${page}`,
        { 
          signal: abortController.current.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      );

      // Check if request was aborted
      if (abortController.current?.signal.aborted) {
        return;
      }

      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();

      // Only update state if request wasn't aborted
      if (!abortController.current?.signal.aborted) {
        if (page === 1) {
          setReviews(data);
        } else {
          setReviews(prev => ({
            ...data,
            items: [...prev.items, ...data.items]
          }));
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      if (!abortController.current?.signal.aborted) {
        setLoading(false);
      }
      if (abortController.current) {
        abortController.current = null;
      }
    }
  }, [productId, starFilter, sort, baseUrl]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchStats();
        await fetchReviews(1);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchStats, fetchReviews]);

  useEffect(() => {
    return () => {
      // Cleanup: abort any ongoing requests when component unmounts
      // or when dependencies change
      if (abortController.current) {
        abortController.current.abort();
        abortController.current = null;
      }
    };
  }, [productId, starFilter, sort]);

  const handleFilterChange = (stars) => {
    setStarFilter(stars);
  };

  const handleReact = async (reviewId, reaction) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/reviews/${reviewId}/react`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({ reaction })
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      
      setReviews(prev => ({
        ...prev,
        items: prev.items.map(r => 
          r.id === reviewId 
            ? { ...r, likes: data.likes, dislikes: data.dislikes }
            : r
        )
      }));
    } catch (err) {
      alert('Không thể thực hiện thao tác. ' + err.message);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyContent.trim()) return;
    
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({ content: replyContent })
      });
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const reply = await response.json();
      
      setReviews(prev => ({
        ...prev,
        items: prev.items.map(r => 
          r.id === reviewId 
            ? { ...r, replies: [...(r.replies || []), reply] }
            : r
        )
      }));
      
      setReplyContent('');
      setReplyingTo(null);
    } catch (err) {
      alert('Không thể gửi phản hồi. ' + err.message);
    }
  };

  const loadMore = () => {
    if (reviews.page < reviews.pages) {
      fetchReviews(reviews.page + 1);
    }
  };

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="review-list">
      <h4 className="mb-3">Đánh giá sản phẩm</h4>
      
      <RatingDistribution stats={stats} />
      
      <div className="d-flex gap-3 align-items-center mb-4">
        <StarFilter onFilterChange={handleFilterChange} />
        
        <select 
          className="form-select" 
          style={{ width: 'auto' }}
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="-createdAt">Mới nhất</option>
          <option value="createdAt">Cũ nhất</option>
          <option value="-rating">Đánh giá cao nhất</option>
          <option value="rating">Đánh giá thấp nhất</option>
          <option value="-likes">Hữu ích nhất</option>
        </select>
      </div>

      {loading && reviews.items.length === 0 ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : reviews.items.length === 0 ? (
        <p className="text-muted">Chưa có đánh giá nào.</p>
      ) : (
        <div className="row g-3">
          {reviews.items.map((review) => (
            <div key={review.id} className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="card-title mb-1">{review.title}</h6>
                      <div className="d-flex gap-2 align-items-center">
                        <span className="badge bg-warning text-dark">
                          {review.rating} ⭐
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="badge bg-success">
                            ✓ Đã mua hàng
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-muted small mb-1">
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>

                  <p className="card-text mb-3">{review.content}</p>
                  
                  <ReviewImageGallery images={review.images} />

                  <div className="d-flex gap-2 mb-3">
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleReact(review.id, 'like')}
                    >
                      👍 Hữu ích ({review.likes || 0})
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleReact(review.id, 'dislike')}
                    >
                      👎 ({review.dislikes || 0})
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setReplyingTo(review.id)}
                    >
                      💬 Trả lời
                    </button>
                  </div>

                  {/* Replies */}
                  {review.replies?.map((reply, i) => (
                    <div key={i} className="ms-4 mt-2 p-3 bg-light rounded">
                      <div className="d-flex justify-content-between">
                        <strong className="mb-1">
                          {reply.isAdmin ? '👨‍💼 Admin' : '👤 Người dùng'}
                        </strong>
                        <small className="text-muted">
                          {formatDate(reply.createdAt)}
                        </small>
                      </div>
                      <p className="mb-0">{reply.content}</p>
                    </div>
                  ))}

                  {/* Reply form */}
                  {replyingTo === review.id && (
                    <div className="mt-3">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập phản hồi của bạn..."
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                        />
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleReply(review.id)}
                        >
                          Gửi
                        </button>
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && reviews.page < reviews.pages && (
        <div className="text-center mt-4">
          <button 
            className="btn btn-outline-primary"
            onClick={loadMore}
          >
            Xem thêm đánh giá
          </button>
        </div>
      )}
    </div>
  );
}