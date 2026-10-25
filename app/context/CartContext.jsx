'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const GUEST_CART_KEY = 'stellar_guest_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const { user, isCheckingAuth } = useAuth();
  const currentUserId = user?.id || user?._id || user?.uid || null;
  const prevUserIdRef = useRef(undefined);

  // Helper to compute total from items
  const computeTotal = (items = []) => {
    return items.reduce((sum, item) => {
      const price = item.variantPrice || item.product?.sellingPrice || item.product?.price || 0;
      return sum + (Number(price) * (item.quantity || 1));
    }, 0);
  };

  // Helper to read guest cart from sessionStorage (clears automatically when browser/tab is closed)
  const getGuestCartFromStorage = () => {
    if (typeof window === 'undefined') return { items: [], total: 0 };
    try {
      const raw = sessionStorage.getItem(GUEST_CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        return { items, total: computeTotal(items) };
      }
    } catch (err) {
      console.warn('[CartContext] Failed to read guest cart from sessionStorage:', err);
    }
    return { items: [], total: 0 };
  };

  // Helper to persist guest cart to sessionStorage
  const saveGuestCartToStorage = (items) => {
    const total = computeTotal(items);
    const cartObj = { items, total };
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartObj));
      } catch (err) {
        console.warn('[CartContext] Failed to write guest cart to sessionStorage:', err);
      }
    }
    setCart(cartObj);
    return cartObj;
  };

  const getCsrfToken = () => {
    if (typeof document === 'undefined') return null;
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf_token='))
      ?.split('=')[1] || null;
  };

  // Fetch cart function
  const fetchCart = useCallback(async () => {
    // If still actively verifying auth token on startup, wait
    if (isCheckingAuth) return;

    setLoading(true);
    try {
      if (currentUserId) {
        // Authenticated Account: Load from DB via API for this specific user
        const res = await fetch(`/api/cart?userId=${encodeURIComponent(currentUserId)}`, {
          credentials: 'include',
          cache: 'no-store'
        });
        const data = await res.json();
        if (data && data.cart && Array.isArray(data.cart.items)) {
          const items = data.cart.items;
          setCart({ items, total: computeTotal(items) });
        } else {
          setCart({ items: [], total: 0 });
        }
      } else {
        // Guest: Load from temporary sessionStorage
        const guestData = getGuestCartFromStorage();
        setCart(guestData);
      }
    } catch (error) {
      console.error('[CartContext] fetchCart error:', error);
      if (!currentUserId) {
        setCart(getGuestCartFromStorage());
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserId, isCheckingAuth]);

  // Synchronize cart whenever auth state or user identity changes
  useEffect(() => {
    if (isCheckingAuth) return;

    // Detect user transition (e.g. login, logout, account switch)
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      // Reset cart in state first so previous account's items never linger
      setCart({ items: [], total: 0 });
      fetchCart();
    }
  }, [currentUserId, isCheckingAuth, fetchCart]);

  /**
   * addToCart
   * @param {Object} product
   * @param {number} quantity
   * @param {Object|null} variantData — { variantSku, selectedAttributes, variantPrice, variantImage }
   */
  const addToCart = async (product, quantity = 1, variantData = null) => {
    try {
      const productId = product?._id || product?.id;
      if (!productId) {
        return { success: false, message: 'Invalid product' };
      }

      // 1. Authenticated User Flow: Save directly to Supabase DB for this user
      if (currentUserId) {
        const csrfToken = getCsrfToken();
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          },
          body: JSON.stringify({
            product,
            quantity,
            userId: currentUserId,
            variantData
          })
        });
        const data = await res.json();

        if (res.ok && data.cart) {
          const items = data.cart.items || [];
          setCart({ items, total: computeTotal(items) });
          return { success: true, message: 'Added to cart!' };
        } else {
          return { success: false, message: data.error || 'Failed to add to cart' };
        }
      }

      // 2. Guest User Flow: Save to sessionStorage only (dies when browser closes)
      const guestCart = getGuestCartFromStorage();
      let items = [...guestCart.items];
      const variantSku = variantData?.variantSku || null;

      const existingIndex = items.findIndex((item) => {
        const itemId = item.product?._id || item.product?.id;
        if (itemId !== productId) return false;
        if (variantSku || item.variantSku || item.variantData?.variantSku) {
          return (item.variantSku || item.variantData?.variantSku) === variantSku;
        }
        return true;
      });

      if (existingIndex >= 0) {
        items[existingIndex].quantity += quantity;
        if (variantData) {
          items[existingIndex].variantData = variantData;
          items[existingIndex].variantPrice = variantData.variantPrice || items[existingIndex].variantPrice;
          items[existingIndex].variantSku = variantSku;
        }
      } else {
        items.push({
          product,
          quantity,
          variantData: variantData || null,
          variantPrice: variantData?.variantPrice || product.sellingPrice || product.price || 0,
          variantSku: variantSku || null,
        });
      }

      saveGuestCartToStorage(items);
      return { success: true, message: 'Added to cart!' };
    } catch (error) {
      console.error('[CartContext] addToCart error:', error);
      return { success: false, message: 'Failed to add to cart' };
    }
  };

  /**
   * updateQuantity
   * @param {string} productId
   * @param {number} quantity
   * @param {string|null} variantSku
   */
  const updateQuantity = async (productId, quantity, variantSku = null) => {
    if (quantity < 1) return;

    const previousCart = { ...cart };

    // Optimistic UI update
    const updatedItems = cart.items.map((item) => {
      const id = item.product?._id || item.product?.id || item.productId || item.id;
      if (String(id) === String(productId)) {
        if (!variantSku || (item.variantSku || item.variantData?.variantSku) === variantSku) {
          return { ...item, quantity };
        }
      }
      return item;
    });
    setCart({ items: updatedItems, total: computeTotal(updatedItems) });

    // 1. Authenticated User Flow: Update in DB
    if (currentUserId) {
      try {
        const csrfToken = getCsrfToken();
        const res = await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          },
          body: JSON.stringify({
            productId,
            quantity,
            userId: currentUserId,
            variantSku
          })
        });
        const data = await res.json();
        if (res.ok && data.cart) {
          const items = data.cart.items || [];
          setCart({ items, total: computeTotal(items) });
        } else {
          setCart(previousCart);
        }
      } catch (error) {
        setCart(previousCart);
      }
      return;
    }

    // 2. Guest User Flow: Update in sessionStorage
    saveGuestCartToStorage(updatedItems);
  };

  /**
   * removeFromCart
   * @param {string} productId
   * @param {string|null} variantSku
   */
  const removeFromCart = async (productId, variantSku = null) => {
    const previousCart = { ...cart };

    // Optimistic UI update
    const updatedItems = cart.items.filter((item) => {
      const id = item.product?._id || item.product?.id || item.productId || item.id;
      if (String(id) !== String(productId)) return true;
      if (variantSku) {
        return (item.variantSku || item.variantData?.variantSku) !== variantSku;
      }
      return false;
    });
    setCart({ items: updatedItems, total: computeTotal(updatedItems) });

    // 1. Authenticated User Flow: Remove from DB
    if (currentUserId) {
      try {
        const csrfToken = getCsrfToken();
        let url = `/api/cart?productId=${encodeURIComponent(productId)}&userId=${encodeURIComponent(currentUserId)}`;
        if (variantSku) {
          url += `&variantSku=${encodeURIComponent(variantSku)}`;
        }
        const res = await fetch(url, {
          method: 'DELETE',
          headers: {
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          }
        });
        const data = await res.json();
        if (res.ok && data.cart) {
          const items = data.cart.items || [];
          setCart({ items, total: computeTotal(items) });
        } else {
          setCart(previousCart);
        }
      } catch (error) {
        setCart(previousCart);
      }
      return;
    }

    // 2. Guest User Flow: Remove from sessionStorage
    saveGuestCartToStorage(updatedItems);
  };

  /**
   * clearCart
   */
  const clearCart = async () => {
    const previousCart = { ...cart };
    setCart({ items: [], total: 0 });

    // 1. Authenticated User Flow: Clear from DB
    if (currentUserId) {
      try {
        const csrfToken = getCsrfToken();
        const res = await fetch(`/api/cart?userId=${encodeURIComponent(currentUserId)}&clear=true`, {
          method: 'DELETE',
          headers: {
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          }
        });
        const data = await res.json();
        if (!res.ok) {
          setCart(previousCart);
        }
      } catch (error) {
        setCart(previousCart);
      }
      return;
    }

    // 2. Guest User Flow: Clear sessionStorage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(GUEST_CART_KEY);
      } catch (err) {
        console.warn('[CartContext] Failed to clear guest cart in sessionStorage:', err);
      }
    }
  };

  const cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
