import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounceQuantityUpdate(updateQuantity, delayMs = 300) {
  const [loadingItems, setLoadingItems] = useState(new Set());
  const pendingRef = useRef(new Map()); // Tracks pending updates: { productId: { quantity, timeoutId } }

  // Cleanup all pending debounce timers when component unmounts
  useEffect(() => {
    return () => {
      pendingRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
      pendingRef.current.clear();
    };
  }, []);

  const processUpdate = useCallback(
    async (productId, quantity, variantSku = null) => {
      const key = variantSku ? `${productId}_${variantSku}` : String(productId);
      setLoadingItems((prev) => new Set(prev).add(key));

      try {
        await updateQuantity(productId, quantity, variantSku);
      } finally {
        setLoadingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        pendingRef.current.delete(key);
      }
    },
    [updateQuantity]
  );

  const updateQuantityWithDebounce = useCallback(
    (productId, newQuantity, variantSku = null) => {
      // Validate quantity
      if (newQuantity < 1) {
        return;
      }

      const key = variantSku ? `${productId}_${variantSku}` : String(productId);

      // Clear existing timeout for this product
      if (pendingRef.current.has(key)) {
        clearTimeout(pendingRef.current.get(key).timeoutId);
      }

      // Schedule new update (this replaces any pending update for this product)
      const timeoutId = setTimeout(() => {
        processUpdate(productId, newQuantity, variantSku);
      }, delayMs);

      // Store the pending update
      pendingRef.current.set(key, { quantity: newQuantity, timeoutId });
    },
    [processUpdate, delayMs]
  );

  const isLoading = useCallback(
    (productId, variantSku = null) => {
      const key = variantSku ? `${productId}_${variantSku}` : String(productId);
      return loadingItems.has(key);
    },
    [loadingItems]
  );

  return { updateQuantityWithDebounce, isLoading };
}
