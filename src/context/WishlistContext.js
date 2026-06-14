"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext({
  wishlist: [],
  wishlistIds: new Set(),
  toggleWishlist: () => {},
  isInWishlist: () => false,
  clearWishlist: () => {}
});

export function WishlistProvider({ children }) {
  // wishlistIds: Set of product IDs saved in localStorage (lightweight)
  const [wishlistIds, setWishlistIds] = useState(new Set());
  // wishlist: full live product objects fetched from API
  const [wishlist, setWishlist] = useState([]);

  // Load saved IDs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mahally_wishlist_ids');
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids) && ids.length > 0) {
          setWishlistIds(new Set(ids));
        }
      } else {
        // Migrate from old format (full product objects)
        const oldData = localStorage.getItem('mahally_wishlist');
        if (oldData) {
          const old = JSON.parse(oldData);
          if (Array.isArray(old) && old.length > 0) {
            const ids = old.map(p => p.id).filter(Boolean);
            setWishlistIds(new Set(ids));
            localStorage.setItem('mahally_wishlist_ids', JSON.stringify(ids));
            localStorage.removeItem('mahally_wishlist');
          }
        }
      }
    } catch (e) {
      console.error("Wishlist load error:", e);
    }
  }, []);

  // Whenever IDs change, fetch live product data
  useEffect(() => {
    const ids = [...wishlistIds];
    if (ids.length === 0) {
      setWishlist([]);
      return;
    }

    // Fetch all products in parallel
    const fetchProducts = async () => {
      const results = await Promise.all(
        ids.map(id =>
          fetch(`/api/products/${id}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      );
      setWishlist(results.filter(Boolean));
    };

    fetchProducts();
  }, [wishlistIds]);

  // Persist IDs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mahally_wishlist_ids', JSON.stringify([...wishlistIds]));
  }, [wishlistIds]);

  const toggleWishlist = (product) => {
    const id = product?.id;
    if (!id) return;
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Optimistically update the full list
    setWishlist(prev => {
      const exists = prev.find(p => p.id === id);
      if (exists) return prev.filter(p => p.id !== id);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId) => wishlistIds.has(productId);

  const clearWishlist = () => {
    setWishlistIds(new Set());
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistIds, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
