import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { Link } from 'react-router-dom';

const WishlistPage = () => {
  const { collections, loading, removeFromWishlist } = useWishlist();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!collections || collections.length === 0) {
    return <div>Your wishlist is empty.</div>;
  }

  return (
    <div className="container mt-5">
      <h2>My Wishlist</h2>
      {collections.map((collection) => (
        <div key={collection._id} className="mb-4">
          <h3>{collection.name}</h3>
          <div className="row">
            {collection.items.map((item) => (
              <div key={item.productId} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      <Link to={`/products/${item.productId}`}>Product Details</Link>
                    </h5>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeFromWishlist(item.productId, collection._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WishlistPage;
