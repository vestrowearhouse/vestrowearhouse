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
    async (productId, quantity) => {
      setLoadingItems((prev) => new Set(prev).add(productId));

      try {
        await updateQuantity(productId, quantity);
      } finally {
        setLoadingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        pendingRef.current.delete(productId);
      }
    },
    [updateQuantity]
  );

  const updateQuantityWithDebounce = useCallback(
    (productId, newQuantity) => {
      // Validate quantity
      if (newQuantity < 1) {
        return;
      }

      // Clear existing timeout for this product
      if (pendingRef.current.has(productId)) {
        clearTimeout(pendingRef.current.get(productId).timeoutId);
      }

      // Schedule new update (this replaces any pending update for this product)
      const timeoutId = setTimeout(() => {
        processUpdate(productId, newQuantity);
      }, delayMs);

      // Store the pending update
      pendingRef.current.set(productId, { quantity: newQuantity, timeoutId });
    },
    [processUpdate, delayMs]
  );

  const isLoading = useCallback(
    (productId) => loadingItems.has(productId),
    [loadingItems]
  );

  return { updateQuantityWithDebounce, isLoading };
}
