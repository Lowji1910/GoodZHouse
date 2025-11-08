import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WishlistCollection from '../components/Wishlist/WishlistCollection';
import { useWishlist } from '../context/WishlistContext';

export default function WishlistPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  
  const navigate = useNavigate();
  const { collections, loading, createCollection } = useWishlist();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCollection.name.trim()) return;

    const success = await createCollection(
      newCollection.name,
      newCollection.description,
      newCollection.isPublic
    );

    if (success) {
      setShowCreate(false);
      setNewCollection({ name: '', description: '', isPublic: false });
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-primary">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Danh sách yêu thích</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
        >
          Tạo bộ sưu tập mới
        </button>
      </div>

      <div className="row g-4">
        {collections.map((collection) => (
          <div key={collection._id} className="col-12">
            <WishlistCollection collection={collection} />
          </div>
        ))}
      </div>

      {/* Create Collection Modal */}
      <div
        className={`modal fade ${showCreate ? 'show' : ''}`}
        style={{ display: showCreate ? 'block' : 'none' }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleCreate}>
              <div className="modal-header">
                <h5 className="modal-title">Tạo bộ sưu tập mới</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreate(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Tên bộ sưu tập</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-control"
                    value={newCollection.description}
                    onChange={(e) => setNewCollection(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                  />
                </div>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isPublic"
                    checked={newCollection.isPublic}
                    onChange={(e) => setNewCollection(prev => ({
                      ...prev,
                      isPublic: e.target.checked
                    }))}
                  />
                  <label className="form-check-label" htmlFor="isPublic">
                    Cho phép chia sẻ công khai
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo bộ sưu tập
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}