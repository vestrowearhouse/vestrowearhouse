'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, Loader2, LogIn, ArrowRight, Check } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { normalizeId } from '@/lib/normalizeId';
import Image from 'next/image';

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [removingId, setRemovingId] = useState(null);
  const [addedIds, setAddedIds] = useState({});

  const handleRemoveFromWishlist = async (productId) => {
    const id = normalizeId(productId);
    setRemovingId(id);
    await removeFromWishlist(id);
    setRemovingId(null);
  };

  const handleAddToCart = async (product) => {
    const pId = normalizeId(product);
    const res = await addToCart(product, 1);
    if (!res?.success) {
      alert(res?.message || 'Failed to add to cart');
    } else {
      setAddedIds(prev => ({ ...prev, [pId]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [pId]: false }));
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="bg-black text-white py-12 sm:py-16 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase block mb-2">
            Vestro Wear House
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase mb-2">
            Wishlist
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm tracking-wide">
            {wishlist.length} {wishlist.length === 1 ? 'item saved' : 'items saved'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs text-neutral-500 uppercase tracking-wider">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <span className="text-black font-semibold">Wishlist</span>
        </div>

        {/* Guest Banner Notice */}
        {!user && wishlist.length > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-neutral-800 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                You are viewing your wishlist as a <strong>guest</strong>. Log in to sync saved items across all your devices.
              </span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              Log In
            </Link>
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 p-12 sm:p-16 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-400 mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wider mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mb-6">
              Save your favorite streetwear pieces by clicking the heart icon on any product.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition active:scale-95"
            >
              Explore Collection <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlist.map((product) => {
              const pId = normalizeId(product);
              const isRemoving = removingId === pId;
              const isAdded = !!addedIds[pId];

              return (
                <div
                  key={pId}
                  className="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-black transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
                      <Link href={`/product/${product.slug || pId}`} className="block w-full h-full">
                        <Image
                          src={product.image || '/placeholder.png'}
                          alt={product.name || 'Product'}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFromWishlist(pId);
                        }}
                        disabled={isRemoving}
                        title="Remove from wishlist"
                        className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm text-neutral-400 hover:text-black transition disabled:opacity-50 z-10"
                      >
                        {isRemoving ? (
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="p-3 sm:p-4">
                      <Link href={`/product/${product.slug || pId}`}>
                        <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 uppercase tracking-tight line-clamp-2 hover:text-neutral-600 transition-colors mb-1.5">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-3">
                        {product.salePrice ? (
                          <>
                            <span className="text-sm sm:text-base font-bold text-neutral-900">৳{product.salePrice}</span>
                            <span className="text-xs text-neutral-400 line-through">৳{product.price}</span>
                          </>
                        ) : (
                          <span className="text-sm sm:text-base font-bold text-neutral-900">৳{product.price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.inStock === false}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition active:scale-95 ${
                        product.inStock === false
                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black hover:bg-neutral-800 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added to Bag
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
