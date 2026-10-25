"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { normalizeId } from "@/lib/normalizeId";

const WishlistContext = createContext();

const GUEST_STORAGE_KEY = 'stellarmart_guest_wishlist';

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const syncedRef = useRef(false);

  // Helper to safely extract and normalize ID string
  const resolveId = (item) => normalizeId(item);

  const getCsrfToken = () => {
    if (typeof document === 'undefined') return null;
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf_token='))
      ?.split('=')[1] || null;
  };

  const loadGuestWishlist = () => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const saveGuestWishlist = (items) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving guest wishlist:', e);
    }
  };

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      const guestItems = loadGuestWishlist();
      setWishlist(guestItems);
      return;
    }

    try {
      const res = await fetch('/api/wishlist', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist || []);
      }
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  }, [user]);

  // Sync guest wishlist to logged-in account once on login (single batch call)
  useEffect(() => {
    if (user) {
      const guestItems = loadGuestWishlist();
      const guestProductIds = guestItems.map(resolveId).filter(Boolean);

      if (guestProductIds.length > 0 && !syncedRef.current) {
        syncedRef.current = true;
        // Merge guest items into server via batch POST
        (async () => {
          try {
            const csrfToken = getCsrfToken();
            const res = await fetch('/api/wishlist', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
              },
              body: JSON.stringify({ productIds: guestProductIds })
            });

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data?.wishlist)) {
                setWishlist(data.wishlist);
              }
            }
          } catch (e) {
            console.error('Error batch syncing guest wishlist:', e);
          } finally {
            try {
              localStorage.removeItem(GUEST_STORAGE_KEY);
            } catch (e) {}
            fetchWishlist();
          }
        })();
      } else {
        fetchWishlist();
      }
    } else {
      syncedRef.current = false;
      const guestItems = loadGuestWishlist();
      setWishlist(guestItems);
    }
  }, [user, fetchWishlist]);

  const addToWishlist = useCallback(async (itemOrId) => {
    const pId = resolveId(itemOrId);
    if (!pId) return { success: false, message: 'Invalid product' };

    // Format item object if available
    const productObj = typeof itemOrId === 'object' && itemOrId !== null
      ? {
          _id: pId,
          id: pId,
          name: itemOrId.name || 'Product',
          slug: itemOrId.slug || pId,
          image: itemOrId.image || itemOrId.featuredImage || '/placeholder.png',
          price: itemOrId.price || itemOrId.sellingPrice || 0,
          salePrice: itemOrId.salePrice || null,
          inStock: itemOrId.inStock ?? true,
        }
      : { _id: pId, id: pId };

    if (!user) {
      // Guest mode
      const current = loadGuestWishlist();
      const exists = current.some(item => resolveId(item) === pId);
      if (!exists) {
        const updated = [productObj, ...current];
        saveGuestWishlist(updated);
        setWishlist(updated);
      }
      return { success: true };
    }

    // Logged in mode
    setLoading(true);
    try {
      const csrfToken = getCsrfToken();
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ productId: pId })
      });

      const data = await res.json();

      if (res.ok) {
        setWishlist(data.wishlist || []);
        return { success: true };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return { success: false, message: 'Failed to add to wishlist' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (itemOrId) => {
    const pId = resolveId(itemOrId);
    if (!pId) return { success: false, message: 'Invalid product' };

    if (!user) {
      // Guest mode
      const current = loadGuestWishlist();
      const updated = current.filter(item => resolveId(item) !== pId);
      saveGuestWishlist(updated);
      setWishlist(updated);
      return { success: true };
    }

    // Logged in mode
    setLoading(true);
    try {
      const csrfToken = getCsrfToken();
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ productId: pId })
      });

      const data = await res.json();

      if (res.ok) {
        setWishlist(data.wishlist || []);
        return { success: true };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return { success: false, message: 'Failed to remove from wishlist' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isInWishlist = useCallback((itemOrId) => {
    const targetId = resolveId(itemOrId);
    if (!targetId) return false;
    return wishlist.some(item => resolveId(item) === targetId);
  }, [wishlist]);

  const value = {
    wishlist,
    wishlistCount: wishlist.length,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    fetchWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};