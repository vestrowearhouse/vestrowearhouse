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
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white py-8 sm:py-12 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-500 mb-3 border border-red-500/20">
            <Heart className="w-6 h-6 fill-red-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1 tracking-tight">আমার উইশলিস্ট (My Wishlist)</h1>
          <p className="text-gray-400 text-sm">{wishlist.length} টি পছন্দের পণ্য সংরক্ষিত আছে</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs sm:text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Wishlist</span>
        </div>

        {/* Guest Banner Notice */}
        {!user && wishlist.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span>
                আপনি <strong>গেস্ট</strong> হিসেবে উইশলিস্ট দেখছেন। অ্যাকাউন্ট লগইন করলে যেকোনো ডিভাইস থেকে সংরক্ষিত পণ্য দেখতে পারবেন।
              </span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              লগইন করুন
            </Link>
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-10 sm:p-14 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">আপনার উইশলিস্ট খালি</h2>
            <p className="text-gray-500 text-sm mb-6">
              পছন্দের পণ্যগুলো হৃদপিন্ড আইকনে ক্লিক করে সংরক্ষণ করুন এবং যেকোনো সময় সহজে অর্ডার করুন।
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition active:scale-95"
            >
              শপিং শুরু করুন <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {wishlist.map((product) => {
              const pId = normalizeId(product);
              const isRemoving = removingId === pId;
              const isAdded = !!addedIds[pId];

              return (
                <div
                  key={pId}
                  className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group relative"
                >
                  <div className="relative aspect-square bg-[#f5f6f8] overflow-hidden">
                    <Link href={`/product/${product.slug || pId}`} className="block w-full h-full">
                      <Image
                        src={product.image || '/placeholder.png'}
                        alt={product.name || 'Product'}
                        fill
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
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
                      title="উইশলিস্ট থেকে মুছুন"
                      className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-sm text-gray-400 hover:text-red-600 transition disabled:opacity-50 z-10"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <Link href={`/product/${product.slug || pId}`}>
                        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 hover:text-red-600 transition-colors mb-2">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-3">
                        {product.salePrice ? (
                          <>
                            <span className="text-sm sm:text-base font-black text-red-600">৳{product.salePrice}</span>
                            <span className="text-xs text-gray-400 line-through">৳{product.price}</span>
                          </>
                        ) : (
                          <span className="text-sm sm:text-base font-black text-gray-900">৳{product.price}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.inStock === false}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition active:scale-95 ${
                        product.inStock === false
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" /> কার্টে যুক্ত হয়েছে
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" /> কার্টে যোগ করুন
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
