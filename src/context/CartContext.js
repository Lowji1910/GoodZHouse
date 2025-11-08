import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const { user } = useAuth();
  const loadedOnceRef = useRef(false);
  const storageKey = user ? `gh_cart_u_${user.id}` : 'gh_cart_guest';

  // Load initial cart from appropriate storage key on mount & when user changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? JSON.parse(raw) : []);
    } catch { setItems([]); }
  }, [storageKey]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== storageKey) return;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setItems(JSON.parse(raw)); else setItems([]);
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [storageKey]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [items, storageKey]);

  // When user logs in, load server cart and merge with local cart, then push merged back to server
  useEffect(() => {
    let cancelled = false;
    const loadAndMerge = async () => {
      if (!user) { loadedOnceRef.current = false; return; }
      try {
        const guestLocal = (() => { try { return JSON.parse(localStorage.getItem('gh_cart_guest')||'[]'); } catch { return []; } })();
        const userLocal = (() => { try { return JSON.parse(localStorage.getItem(`gh_cart_u_${user.id}`)||'[]'); } catch { return []; } })();
        const server = await api.getCart().catch(() => ({ items: [] }));
        // Start with server items as source of truth
        const map = new Map((server.items || []).map(it => [
          it.productId?.toString?.() || it.id,
          { id: it.productId || it.id, quantity: Number(it.quantity)||1, name: it.name, price: it.priceAtAdd || it.price, image: it.image }
        ]));
        // Merge user-local then guest-local: do not sum; take max to avoid doubling
        const mergeFrom = (arr) => {
          (arr || []).forEach(it => {
            const id = it.productId || it.id;
            if (!id) return;
            const qty = Math.max(1, Number(it.quantity)||1);
            const existing = map.get(id);
            if (!existing) {
              map.set(id, { id, quantity: qty, name: it.name, price: it.priceAtAdd || it.price, image: it.image });
            } else {
              existing.quantity = Math.max(existing.quantity, qty);
              if (!existing.name && it.name) existing.name = it.name;
              if ((existing.price == null) && (it.priceAtAdd != null || it.price != null)) existing.price = it.priceAtAdd || it.price;
              if (!existing.image && it.image) existing.image = it.image;
            }
          });
        };
        mergeFrom(userLocal);
        mergeFrom(guestLocal);
        const merged = Array.from(map.values());
        if (!cancelled) {
          setItems(merged);
          await api.putCart(merged).catch(() => {});
          loadedOnceRef.current = true;
          // Clear guest cart after merge to avoid leaking into other accounts
          localStorage.removeItem('gh_cart_guest');
        }
      } catch {}
    };
    loadAndMerge();
    return () => { cancelled = true; };
  }, [user]);

  // Push local changes to server when logged in
  useEffect(() => {
    if (!user || !loadedOnceRef.current) return;
    const t = setTimeout(() => {
      api.putCart(items).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [items, user]);

  // Hydrate items missing name/image from product API
  useEffect(() => {
    let cancelled = false;
    const missing = items.filter(it => !it.name || !it.image);
    if (missing.length === 0) return;
    const run = async () => {
      try {
        const results = await Promise.all(missing.map(async it => {
          try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/products/${it.id}`);
            if (!res.ok) throw new Error('HTTP '+res.status);
            const p = await res.json();
            return [it.id, { name: p.name, image: Array.isArray(p.images)&&p.images[0] ? p.images[0] : it.image, price: it.price ?? p.price }];
          } catch { return [it.id, null]; }
        }));
        const map = new Map(results.filter(([id, v]) => !!v));
        if (cancelled || map.size === 0) return;
        setItems(prev => prev.map(it => map.has(it.id) ? { ...it, ...map.get(it.id) } : it));
      } catch {}
    };
    run();
    return () => { cancelled = true; };
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, quantity }];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const updateQty = (id, quantity) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity } : it)));
  const clear = () => setItems([]);

  const total = useMemo(() => items.reduce((s, it) => s + (it.price || 0) * it.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((s, it) => s + it.quantity, 0), [items]);

  const value = { items, addItem, removeItem, updateQty, clear, total, count };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}


