'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDebounceQuantityUpdate } from '../hooks/useDebounceQuantityUpdate';

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const items = cart?.items || [];
  const { updateQuantityWithDebounce, isLoading } = useDebounceQuantityUpdate(updateQuantity, 300);

  // Hydration error ফিক্স করার জন্য
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const product = item.product || {};
      const price = item.variantPrice || product.sellingPrice || product.price || 0;
      return total + Number(price) * (item.quantity || 1);
    }, 0);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-24 h-24 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link 
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => {
              const product = item.product || {};
              const productId = product._id || product.id || item.productId || item.id;
              const variantSku = item.variantSku || item.variantData?.variantSku || null;
              const itemKey = `${productId}-${variantSku || index}`;
              const price = item.variantPrice || product.sellingPrice || product.price || 0;
              const image = item.variantData?.variantImage || product.featuredImage || (product.images && product.images[0]) || product.image || '';
              return (
              <div key={itemKey} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
                <div className="w-24 h-24 relative flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {image ? (
                    <img src={image} alt={product.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${product.slug}`} className="text-lg font-semibold text-gray-800 hover:text-blue-600 truncate block">
                    {product.name}
                  </Link>
                  {/* Selected Attributes & Variant */}
                  {(item.variantData?.selectedAttributes || item.selectedAttributes) && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                      {Object.entries(item.variantData?.selectedAttributes || item.selectedAttributes).map(([k, v]) => (
                        <span key={k} className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.variantSku && (
                    <p className="text-[11px] text-gray-400 font-mono mb-1">SKU: {item.variantSku}</p>
                  )}
                  <p className="text-gray-500 text-sm mb-2">{product.category?.name || product.category}</p>
                  <p className="text-blue-600 font-bold font-mono">৳ {Number(price).toLocaleString()}</p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button 
                    onClick={() => removeFromCart(productId, variantSku)}
                    className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantityWithDebounce(productId, item.quantity - 1, variantSku)}
                      disabled={item.quantity <= 1 || isLoading(productId, variantSku)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-medium w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantityWithDebounce(productId, item.quantity + 1, variantSku)}
                      disabled={isLoading(productId, variantSku)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>)
            })}
            
            <div className="flex justify-end">
              <button 
                onClick={clearCart}
                className="text-red-600 font-medium hover:underline text-sm"
              >
                Clear All Items
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-fit sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.length} items)</span>
                <span>৳ {getCartTotal().toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">৳ {getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Link 
              href="/checkout?source=cart"
              className="w-full block text-center py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}