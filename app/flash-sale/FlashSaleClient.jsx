'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Flame, 
  Clock, 
  Heart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  ChevronRight, 
  ArrowUpDown, 
  Search, 
  Sparkles
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

export default function FlashSaleClient({ initialData }) {
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  const [data, setData] = useState(initialData || { enabled: true, title: 'Flash Sale', endDate: null, items: [] });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('discount_high');
  const [searchQuery, setSearchQuery] = useState('');

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
    isExpired: false
  });

  // Calculate live countdown
  useEffect(() => {
    const updateCountdown = () => {
      let targetTime;
      if (data?.endDate) {
        targetTime = new Date(data.endDate).getTime();
      } else {
        const tomorrow = new Date();
        tomorrow.setHours(23, 59, 59, 999);
        targetTime = tomorrow.getTime();
      }

      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00', isExpired: true });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
        isExpired: false
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data?.endDate]);

  // Extract unique categories from items (filter out raw UUIDs)
  const categories = useMemo(() => {
    const set = new Set();
    (data?.items || []).forEach(item => {
      const cat = (item.category || '').trim();
      if (cat && !/^[0-9a-fA-F-]{20,}$/.test(cat)) {
        set.add(cat);
      }
    });
    return Array.from(set);
  }, [data?.items]);

  // Filtered & Sorted Items
  const displayItems = useMemo(() => {
    let list = [...(data?.items || [])];

    // Category Filter
    if (selectedCategory !== 'all') {
      list = list.filter(item => 
        (item.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        (item.name || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      const priceA = Number(a.flashPrice || a.sellingPrice || a.price || 0);
      const priceB = Number(b.flashPrice || b.sellingPrice || b.price || 0);
      const discA = Number(a.discountPercent || a.discount || 0);
      const discB = Number(b.discountPercent || b.discount || 0);

      if (sortBy === 'discount_high') return discB - discA;
      if (sortBy === 'price_low') return priceA - priceB;
      if (sortBy === 'price_high') return priceB - priceA;
      if (sortBy === 'stock_low') return Number(a.stockLeft || 10) - Number(b.stockLeft || 10);
      return 0;
    });

    return list;
  }, [data?.items, selectedCategory, searchQuery, sortBy]);

  // Toggle Wishlist
  const handleWishlist = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const pId = item._id || item.id || item.productId;
    if (!user) {
      alert('Please login to save items to your wishlist.');
      return;
    }
    if (isInWishlist(pId)) {
      removeFromWishlist(pId);
    } else {
      addToWishlist({
        _id: pId,
        name: item.name,
        image: item.image,
        price: Number(item.flashPrice || item.sellingPrice || 0)
      });
    }
  };

  const isSaleActive = data?.enabled !== false && !timeLeft.isExpired;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      
      {/* ── 1. Hero Header Banner (Compact & Mobile-Optimized) ── */}
      <div className="relative bg-gradient-to-r from-[#0d1117] via-[#1a0f0f] to-[#170808] text-white overflow-hidden py-4 sm:py-5 md:py-6 border-b border-red-950/40">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ff3b30_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            
            {/* Left Content */}
            <div className="text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[11px] font-bold uppercase tracking-wider">
                  <Flame size={12} className="text-red-500 fill-red-500" />
                  Limited Time Deals
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Exclusive Pricing
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                {data?.title || 'Mega Flash Sale'}
              </h1>
              
              <p className="hidden sm:block mt-1 text-xs md:text-sm text-gray-300 font-medium max-w-xl">
                Grab top-rated electronics and accessories at rock-bottom prices before discounts vanish!
              </p>

              {/* Guarantees Badges - hidden on mobile to keep banner compact, visible on lg screens */}
              <div className="hidden lg:flex items-center gap-2.5 mt-2.5 text-[11px] text-gray-300">
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                  <Truck size={12} className="text-green-400" />
                  <span>Fast Delivery Across BD</span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                  <ShieldCheck size={12} className="text-blue-400" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                  <RotateCcw size={12} className="text-amber-400" />
                  <span>Easy 7-Day Returns</span>
                </div>
              </div>
            </div>

            {/* Right: Compact Live Countdown / Status Card */}
            <div className="w-full sm:w-auto flex-shrink-0 flex justify-center">
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-lg text-center flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400">
                  <Clock size={14} className="text-orange-400" />
                  <span>{isSaleActive ? 'Ends In:' : 'Sale Status:'}</span>
                </div>

                {isSaleActive ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Days */}
                    {Number(timeLeft.days) > 0 && (
                      <>
                        <div className="flex flex-col items-center">
                          <div className="w-9 sm:w-10 h-9 sm:h-10 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-sm sm:text-base font-black text-white shadow-inner">
                            {timeLeft.days}
                          </div>
                          <span className="text-[9px] uppercase font-semibold text-gray-400 mt-0.5">d</span>
                        </div>
                        <span className="text-sm font-bold text-red-400">:</span>
                      </>
                    )}

                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <div className="w-9 sm:w-10 h-9 sm:h-10 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-sm sm:text-base font-black text-white shadow-inner">
                        {timeLeft.hours}
                      </div>
                      <span className="text-[9px] uppercase font-semibold text-gray-400 mt-0.5">h</span>
                    </div>

                    <span className="text-sm font-bold text-red-400">:</span>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <div className="w-9 sm:w-10 h-9 sm:h-10 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-sm sm:text-base font-black text-white shadow-inner">
                        {timeLeft.minutes}
                      </div>
                      <span className="text-[9px] uppercase font-semibold text-gray-400 mt-0.5">m</span>
                    </div>

                    <span className="text-sm font-bold text-red-400">:</span>

                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                      <div className="w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-b from-[#e11d48] to-[#be123c] border border-red-500/50 rounded-lg flex items-center justify-center text-sm sm:text-base font-black text-white shadow-md shadow-red-600/30">
                        {timeLeft.seconds}
                      </div>
                      <span className="text-[9px] uppercase font-semibold text-red-400 mt-0.5">s</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-red-900/40 text-red-300 font-semibold border border-red-700/30">
                      Campaign Concluded
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Deals Active
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 2. Filters & Sort Controls Bar ── */}
      <div className="bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-[#f85606] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Deals ({data?.items?.length || 0})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#f85606] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
              {/* Search Box */}
              <div className="relative flex-1 md:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search deals..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-red-500 focus:bg-white transition"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <ArrowUpDown size={14} className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                >
                  <option value="discount_high">Biggest Discount %</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="stock_low">Selling Out Fastest</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 3. Products Grid ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        
        {displayItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {displayItems.map((item, index) => {
              const pId = item._id || item.id || item.productId;
              const flashPrice = Number(item.flashPrice || item.sellingPrice || item.price || 0);
              const originalPrice = Number(item.originalPrice || item.regularPrice || 0);
              const discountPercent = Number(item.discountPercent || item.discount || 0);
              const stockLeft = Number(item.stockLeft || 4);
              const totalStock = Number(item.totalStock || stockLeft + 12);
              const percentSold = Math.min(95, Math.max(45, Math.round(((totalStock - stockLeft) / totalStock) * 100)));
              const isWish = isInWishlist(pId);
              const cleanCategory = item.category && !/^[0-9a-fA-F-]{20,}$/.test(item.category) ? item.category : null;

              return (
                <Link
                  key={pId || index}
                  href={`/product/${item.slug || pId}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:border-red-400 hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                >
                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 pointer-events-none">
                    {discountPercent > 0 && (
                      <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                        <Flame size={12} className="fill-white" />
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlist(e, item)}
                    aria-label="Wishlist"
                    className="absolute top-2.5 right-2.5 z-20 p-2 bg-white/90 hover:bg-white backdrop-blur-xs rounded-full shadow-sm text-gray-400 hover:text-red-500 transition active:scale-90"
                  >
                    <Heart size={16} className={isWish ? 'fill-red-500 text-red-500' : ''} />
                  </button>

                  {/* Product Image */}
                  <div className="block relative w-full aspect-square bg-[#f5f6f8] overflow-hidden">
                    <Image
                      src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}
                      alt={item.name || 'Flash Deal'}
                      fill
                      referrerPolicy="no-referrer"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                    
                    {/* Category */}
                    {cleanCategory && (
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 line-clamp-1">
                        {cleanCategory}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-red-600 transition line-clamp-2 leading-snug mb-2 min-h-[2rem]">
                      {item.name}
                    </h3>

                    {/* Pricing */}
                    <div className="mt-auto pt-2">
                      <div className="flex items-baseline gap-2 flex-wrap mb-2">
                        <span className="text-base sm:text-lg md:text-xl font-black text-red-600">
                          ৳{flashPrice.toLocaleString()}
                        </span>
                        {originalPrice > flashPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ৳{originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Stock Urgency Meter */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-orange-600 flex items-center gap-1">
                            <Flame size={11} className="fill-orange-600" />
                            {stockLeft <= 5 ? `Only ${stockLeft} Left!` : `${percentSold}% Claimed`}
                          </span>
                          <span className="text-gray-400 font-normal">Limited Deal</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stockLeft <= 3 
                                ? 'bg-gradient-to-r from-red-600 to-rose-500' 
                                : 'bg-gradient-to-r from-orange-500 to-amber-400'
                            }`}
                            style={{ width: `${percentSold}%` }}
                          />
                        </div>
                      </div>

                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
              <Zap size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Flash Deals Match Your Filters</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Try switching category chips or clearing your search keywords to view other available campaign discounts.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="mt-4 px-5 py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>

      {/* ── 4. Flash Sale Bottom Promo Banner ── */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#083b66] rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
              <Sparkles size={13} />
              Looking for more products?
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black">Explore Our Entire Catalog</h3>
            <p className="text-xs sm:text-sm text-blue-100 max-w-lg">
              Browse over hundreds of mechanical keyboards, wireless mice, audio gear, and lifestyle products with doorstep delivery.
            </p>
          </div>

          <Link
            href="/shop"
            className="px-6 py-3 bg-white hover:bg-amber-400 text-gray-900 hover:text-black font-extrabold text-sm rounded-xl transition shadow-lg flex items-center gap-2 flex-shrink-0 z-10"
          >
            <span>Visit All Products</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

    </div>
  );
}
