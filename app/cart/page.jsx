'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDebounceQuantityUpdate } from '../hooks/useDebounceQuantityUpdate';

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const items = cart?.items || [];
  const { updateQuantityWithDebounce, isLoading } = useDebounceQuantityUpdate(updateQuantity, 300);

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
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-20 h-20 text-neutral-300 stroke-1 mb-4" />
        <h1 className="text-xl font-bold uppercase tracking-widest text-neutral-900 mb-2">Your Bag Is Empty</h1>
        <p className="text-sm text-neutral-500 mb-6">Explore our latest drops and premium streetwear essentials.</p>
        <Link 
          href="/shop"
          className="px-8 py-3 bg-neutral-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-neutral-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-neutral-900">Shopping Bag</h1>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <Link 
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 divide-y divide-neutral-200">
            {items.map((item, index) => {
              const product = item.product || {};
              const productId = product._id || product.id || item.productId || item.id;
              const variantSku = item.variantSku || item.variantData?.variantSku || null;
              const itemKey = `${productId}-${variantSku || index}`;
              const price = item.variantPrice || product.sellingPrice || product.price || 0;
              const image = item.variantData?.variantImage || product.featuredImage || (product.images && product.images[0]) || product.image || '';
              return (
              <div key={itemKey} className="py-6 flex gap-4 sm:gap-6 items-start">
                <div className="w-20 sm:w-28 aspect-[3/4] relative flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                  {image ? (
                    <img src={image} alt={product.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">No Image</div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${product.slug}`} className="text-sm sm:text-base font-bold text-neutral-900 hover:text-black truncate block">
                    {product.name}
                  </Link>
                  {/* Selected Attributes & Variant */}
                  {(item.variantData?.selectedAttributes || item.selectedAttributes) && (
                    <div className="flex flex-wrap gap-1 mt-1.5 mb-1.5">
                      {Object.entries(item.variantData?.selectedAttributes || item.selectedAttributes).map(([k, v]) => (
                        <span key={k} className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-800 uppercase tracking-wider">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.variantSku && (
                    <p className="text-[11px] text-neutral-400 font-mono mb-1">SKU: {item.variantSku}</p>
                  )}
                  <p className="text-neutral-900 font-black text-base sm:text-lg mt-2">৳{Number(price).toLocaleString()}</p>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch">
                  <button 
                    onClick={() => removeFromCart(productId, variantSku)}
                    className="text-neutral-400 hover:text-black p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center border border-neutral-300 rounded overflow-hidden mt-4">
                    <button 
                      onClick={() => updateQuantityWithDebounce(productId, item.quantity - 1, variantSku)}
                      disabled={item.quantity <= 1 || isLoading(productId, variantSku)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 text-neutral-700 font-bold transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold w-8 text-center text-xs text-neutral-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantityWithDebounce(productId, item.quantity + 1, variantSku)}
                      disabled={isLoading(productId, variantSku)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 text-neutral-700 font-bold transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>)
            })}
            
            <div className="pt-4 flex justify-between items-center">
              <Link href="/shop" className="sm:hidden text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black">
                ← Continue Shopping
              </Link>
              <button 
                onClick={clearCart}
                className="text-neutral-400 font-medium hover:text-black text-xs uppercase tracking-wider ml-auto"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 bg-neutral-50 rounded-2xl p-6 sm:p-7 border border-neutral-200 sticky top-24">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 mb-6 pb-3 border-b border-neutral-200">Order Summary</h2>
            
            <div className="space-y-3 mb-6 text-xs uppercase tracking-wider">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-bold text-neutral-900">৳{getCartTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span className="text-neutral-500">Calculated at checkout</span>
              </div>
              <div className="border-t border-neutral-200 pt-3 mt-3">
                <div className="flex justify-between items-baseline font-black text-base text-neutral-900">
                  <span className="uppercase tracking-widest text-xs font-bold text-neutral-500">Total</span>
                  <span className="text-2xl font-black">৳{getCartTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Link 
              href="/checkout?source=cart"
              className="w-full block text-center py-3.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-[0.18em] transition-all shadow-sm"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}