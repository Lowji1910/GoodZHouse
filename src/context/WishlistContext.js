import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/wishlist`);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      setCollections(data.collections);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const addToWishlist = async (productId, collectionId, notify = false) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/wishlist/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          notifyOnDiscount: notify
        })
      });
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      await fetchWishlist(); // Refresh data
      return true;
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      return false;
    }
  };

  const removeFromWishlist = async (productId, collectionId) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(
        `${baseUrl}/api/wishlist/collections/${collectionId}/items/${productId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      await fetchWishlist(); // Refresh data
      return true;
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      return false;
    }
  };

  const createCollection = async (name, description = '', isPublic = false) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/wishlist/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isPublic })
      });
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      await fetchWishlist(); // Refresh data
      return true;
    } catch (err) {
      console.error('Failed to create collection:', err);
      return false;
    }
  };

  const shareCollection = async (collectionId) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/wishlist/collections/${collectionId}/share`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      return data.shareToken;
    } catch (err) {
      console.error('Failed to share collection:', err);
      return null;
    }
  };

  const addCollectionToCart = async (collectionId) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/wishlist/collections/${collectionId}/add-to-cart`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      return data.addedItems;
    } catch (err) {
      console.error('Failed to add collection to cart:', err);
      return 0;
    }
  };

  const value = {
    collections,
    loading,
    addToWishlist,
    removeFromWishlist,
    createCollection,
    shareCollection,
    addCollectionToCart,
    refresh: fetchWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
}