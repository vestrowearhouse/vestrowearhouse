import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (product, quantity = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item._id === product._id);

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...currentItems, { ...product, quantity }] });
        }
      },
      
      removeFromCart: (productId) => {
        set({ items: get().items.filter((item) => item._id !== productId) });
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) return;
        set({
          items: get().items.map((item) =>
            item._id === productId ? { ...item, quantity } : item
          ),
        });
      },
      
      clearCart: () => set({ items: [] }),
    }),
    { name: 'cart-storage' } // This saves the cart in localStorage
  )
);

export default useCartStore;