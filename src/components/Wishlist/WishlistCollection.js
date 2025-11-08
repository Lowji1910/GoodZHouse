import { useState } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

export default function WishlistCollection({ collection }) {
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { removeFromWishlist, shareCollection, addCollectionToCart } = useWishlist();
  const { addItem } = useCart();

  const handleShare = async () => {
    const token = await shareCollection(collection._id);
    if (token) {
      const url = `${window.location.origin}/wishlist/shared/${token}`;
      setShareUrl(url);
      setShowShare(true);
    }
  };

  const handleAddToCart = async () => {
    const added = await addCollectionToCart(collection._id);
    if (added > 0) {
      alert(`Đã thêm ${added} sản phẩm vào giỏ hàng`);
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{collection.name}</h5>
          <div className="btn-group">
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={handleShare}
            >
              Chia sẻ
            </button>
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleAddToCart}
              disabled={!collection.items?.length}
            >
              Thêm tất cả vào giỏ
            </button>
          </div>
        </div>
        {collection.description && (
          <small className="text-muted">{collection.description}</small>
        )}
      </div>

      <div className="card-body">
        {collection.items?.length === 0 ? (
          <p className="text-muted text-center mb-0">
            Chưa có sản phẩm nào
          </p>
        ) : (
          <div className="row g-3">
            {collection.items.map((item) => (
              <div key={item.productId._id} className="col-12">
                <div className="d-flex gap-3">
                  {item.productId.images?.[0] && (
                    <img
                      src={item.productId.images[0]}
                      alt=""
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: 'cover'
                      }}
                      className="rounded"
                    />
                  )}
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{item.productId.name}</h6>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-danger">
                          {item.productId.price?.toLocaleString('vi-VN')}₫
                        </div>
                        {item.notifyOnDiscount && (
                          <small className="text-muted">
                            🔔 Thông báo khi giảm giá
                          </small>
                        )}
                      </div>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFromWishlist(
                            item.productId._id,
                            collection._id
                          )}
                        >
                          Xóa
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => addItem(item.productId, 1)}
                        >
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <div
        className={`modal fade ${showShare ? 'show' : ''}`}
        style={{ display: showShare ? 'block' : 'none' }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Chia sẻ danh sách</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowShare(false)}
              />
            </div>
            <div className="modal-body">
              <p>Sao chép đường dẫn để chia sẻ:</p>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={shareUrl}
                  readOnly
                />
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert('Đã sao chép!');
                  }}
                >
                  Sao chép
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}