'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Flame, 
  Sparkles, 
  Tag, 
  Shirt, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Ticket, 
  Truck, 
  Bot, 
  Gift, 
  ShoppingBag, 
  Heart, 
  Percent, 
  Watch, 
  Headphones, 
  Star, 
  Award, 
  Compass, 
  Search, 
  Grid, 
  Package, 
  Clock, 
  CreditCard, 
  Layers,
  ChevronRight
} from 'lucide-react';
import ProductCard from './ProductCard';

const ICON_MAP = {
  Flame,
  Sparkles,
  Tag,
  Shirt,
  ShieldCheck,
  Zap,
  Smartphone,
  Ticket,
  Truck,
  Bot,
  Gift,
  ShoppingBag,
  Heart,
  Percent,
  Watch,
  Headphones,
  Star,
  Award,
  Compass,
  Search,
  Grid,
  Package,
  Clock,
  CreditCard,
  Layers,
};

export default function MobileHomeView({ 
  categories = [], 
  featuredProducts = [], 
  newArrivals = [], 
  allProducts = [], 
  banners = [],
  flashSaleConfig = null,
  quickChannelsConfig = null
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  
  // Dynamic countdown for flash sale based on admin configured deadline
  const [timeLeft, setTimeLeft] = useState({ hours: '04', minutes: '28', seconds: '52' });

  useEffect(() => {
    const updateTimer = () => {
      let targetTime;
      if (flashSaleConfig?.endDate) {
        targetTime = new Date(flashSaleConfig.endDate).getTime();
      } else {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        targetTime = endOfDay.getTime();
      }

      const diff = Math.max(0, targetTime - Date.now());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [flashSaleConfig?.endDate]);

  const isFlashSaleActive = flashSaleConfig ? flashSaleConfig.enabled !== false : true;

  // Flash Sale Items (uses admin curated list if present, else fallback)
  const flashSaleItems = React.useMemo(() => {
    if (flashSaleConfig?.items && Array.isArray(flashSaleConfig.items) && flashSaleConfig.items.length > 0) {
      return flashSaleConfig.items.map((item, idx) => ({
        _id: item.productId || idx,
        slug: item.slug || item.productId,
        name: item.name,
        price: item.flashPrice,
        sellingPrice: item.flashPrice,
        regularPrice: item.originalPrice,
        originalPrice: item.originalPrice,
        discountPercent: item.discountPercent,
        stockLeft: item.stockLeft || 4,
        image: item.image,
      }));
    }
    return (featuredProducts.length > 0 ? featuredProducts : allProducts).slice(0, 8);
  }, [flashSaleConfig?.items, featuredProducts, allProducts]);
  
  // Filter products based on selected tab
  let displayJustForYou = allProducts.length > 0 ? allProducts : [...featuredProducts, ...newArrivals];
  if (activeTab === 'mega') {
    displayJustForYou = displayJustForYou.filter(p => (p.discountPercent || p.discount || 0) > 0 || p.isFeatured);
  } else if (activeTab === 'daily') {
    displayJustForYou = newArrivals.length > 0 ? newArrivals : displayJustForYou;
  }

  // Active promo banners carousel
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const promoBanner = banners.length > 0 ? banners[currentBannerIndex] : null;

  // Touch swipe support for banner
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDist = 45;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || banners.length <= 1) return;
    const dist = touchStart - touchEnd;
    if (dist > minSwipeDist) {
      // Swiped left -> next
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    } else if (dist < -minSwipeDist) {
      // Swiped right -> prev
      setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  const isChannelsActive = quickChannelsConfig ? quickChannelsConfig.enabled !== false : true;

  // Channels (uses admin configured channels if present, else fallback)
  const displayChannels = React.useMemo(() => {
    if (quickChannelsConfig?.channels && Array.isArray(quickChannelsConfig.channels) && quickChannelsConfig.channels.length > 0) {
      return quickChannelsConfig.channels.filter(c => c.enabled !== false);
    }
    return [
      { id: 'mega-deals', name: 'Mega Deals', icon: 'Flame', bg: 'from-amber-400 to-orange-500', href: '/shop?featured=true', enabled: true },
      { id: 'low-price', name: 'Low Price', icon: 'Tag', bg: 'from-yellow-400 to-amber-500', href: '/shop?sort=price-asc', enabled: true },
      { id: 'beauty-finds', name: 'Beauty Finds', icon: 'Sparkles', bg: 'from-pink-400 to-rose-500', href: '/categories', enabled: true },
      { id: 'fashion-look', name: 'Fashion Look', icon: 'Shirt', bg: 'from-purple-500 to-indigo-500', href: '/categories', enabled: true },
      { id: 'stellar-mall', name: 'StellarMall', icon: 'ShieldCheck', bg: 'from-blue-600 to-indigo-700', href: '/shop', enabled: true },
      { id: 'flash-sale', name: 'Flash Sale', icon: 'Zap', bg: 'from-red-500 to-rose-600', href: '#mobile-flash-sale', enabled: true },
      { id: 'electronics', name: 'Electronics', icon: 'Smartphone', bg: 'from-sky-400 to-blue-600', href: '/categories', enabled: true },
      { id: 'vouchers', name: 'Vouchers', icon: 'Ticket', bg: 'from-fuchsia-500 to-pink-500', href: '/profile', enabled: true },
      { id: 'free-delivery', name: 'Free Delivery', icon: 'Truck', bg: 'from-emerald-400 to-green-600', href: '/shop', enabled: true },
      { id: 'ai-support', name: 'AI Support', icon: 'Bot', bg: 'from-blue-500 to-cyan-500', href: '#ai-chat', actionType: 'ai-chat', enabled: true },
    ];
  }, [quickChannelsConfig?.channels]);

  return (
    <div className="md:hidden bg-[#f4f5f8] min-h-screen pb-12 pt-1.5">
      
      {/* 1. Promo Banner Carousel (Top of mobile home) */}
      {promoBanner && (
        <div className="mx-3.5 mt-2 mb-4">
          <div 
            className="overflow-hidden rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-gray-200/90 relative group bg-white"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Link href={promoBanner.link || '/shop'} className="block relative w-full aspect-[16/9] bg-gradient-to-r from-orange-500 to-amber-500">
              <Image
                key={promoBanner.id || currentBannerIndex}
                src={promoBanner.image || 'https://res.cloudinary.com/do56bvtzt/image/upload/v1791130599/stellar-mart/defaults/mobile_promo_1.webp'}
                alt={promoBanner.title || 'Promo Banner'}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                priority
                sizes="(max-width: 640px) 100vw, 640px"
                referrerPolicy="no-referrer"
              />
              {Boolean(promoBanner.title?.trim()) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3 text-white pointer-events-none">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-300 drop-shadow">Special Offer</span>
                  <h2 className="text-sm font-extrabold line-clamp-1 drop-shadow">{promoBanner.title}</h2>
                </div>
              )}

              {banners.length > 1 && (
                <div className="absolute bottom-2.5 right-3 flex gap-1 z-10">
                  {banners.slice(0, 6).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentBannerIndex(i);
                      }}
                      aria-label={`Go to slide ${i + 1}`}
                      className="p-2 -m-1 flex items-center justify-center cursor-pointer touch-manipulation"
                    >
                      <span className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentBannerIndex ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/60'
                      }`} />
                    </button>
                  ))}
                </div>
              )}
            </Link>
          </div>

          {/* Mobile Trust Badges Bar */}
          <div className="mt-2.5 bg-gradient-to-r from-emerald-50 via-blue-50 to-indigo-50 border border-emerald-100/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-bold text-gray-800 shadow-xs">
            <div className="flex items-center gap-1 text-emerald-800">
              <span className="text-sm">💵</span>
              <span>ক্যাশ অন ডেলিভারি</span>
            </div>
            <div className="w-[1px] h-3.5 bg-gray-300"></div>
            <div className="flex items-center gap-1 text-blue-800">
              <span className="text-sm">🚚</span>
              <span>দ্রুত ডেলিভারি</span>
            </div>
            <div className="w-[1px] h-3.5 bg-gray-300"></div>
            <div className="flex items-center gap-1 text-purple-800">
              <span className="text-sm">🔄</span>
              <span>৭ দিনের রিটার্ন</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quick Channels (Admin Controlled) - Under Banner */}
      {isChannelsActive && displayChannels.length > 0 && (
        <div className="bg-white mx-2.5 mt-2.5 p-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-5 gap-y-3.5 gap-x-1">
            {displayChannels.map((channel, idx) => {
              const bgClass = channel.bg?.startsWith('from-') 
                ? `bg-gradient-to-br ${channel.bg}` 
                : channel.bg || 'bg-blue-600';
              
              const IconComp = typeof channel.icon === 'string' ? ICON_MAP[channel.icon] : channel.icon;

              const content = (
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className={`w-11 h-11 rounded-2xl ${bgClass} flex items-center justify-center text-white shadow-sm group-active:scale-90 transition-transform duration-200`}>
                    {IconComp ? (
                      <IconComp className="w-5 h-5 stroke-[2.2]" />
                    ) : (
                      <span className="text-base leading-none">{channel.icon || '🔘'}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-gray-700 text-center leading-tight mt-1.5 line-clamp-1 w-full px-0.5">
                    {channel.name}
                  </span>
                </div>
              );

              if (channel.actionType === 'ai-chat' || channel.href === '#ai-chat') {
                return (
                  <div 
                    key={channel.id || idx} 
                    onClick={() => {
                      const chatBtn = document.querySelector('button[aria-label="Open chat"]') || 
                                      document.querySelector('#ai-chat-toggle-button');
                      if (chatBtn) chatBtn.click();
                    }}
                  >
                    {content}
                  </div>
                );
              }

              return (
                <Link key={channel.id || idx} href={channel.href || '/shop'}>
                  {content}
                </Link>
              );
            })}
          </div>

          {/* Micro Channel Indicator */}
          <div className="flex justify-center mt-3 pt-1">
            <span className="w-5 h-1 bg-[#f85606] rounded-full inline-block mr-1"></span>
            <span className="w-2 h-1 bg-gray-200 rounded-full inline-block"></span>
          </div>
        </div>
      )}

      {/* 3. Flash Sale Section with Stock Count & Countdown */}
      {isFlashSaleActive && flashSaleItems.length > 0 && (
        <div id="mobile-flash-sale" className="bg-white mx-2.5 mt-3 p-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="text-base font-black text-gray-900 tracking-tight">Fla</span>
                <span className="text-base font-black text-[#f85606]">⚡</span>
                <span className="text-base font-black text-gray-900 tracking-tight">h Sale</span>
              </div>
              {/* Countdown Ticker */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <span className="bg-[#f85606] text-white px-1.5 py-0.5 rounded">{timeLeft.hours}</span>
                <span className="text-[#f85606]">:</span>
                <span className="bg-[#f85606] text-white px-1.5 py-0.5 rounded">{timeLeft.minutes}</span>
                <span className="text-[#f85606]">:</span>
                <span className="bg-[#f85606] text-white px-1.5 py-0.5 rounded">{timeLeft.seconds}</span>
              </div>
            </div>
            <Link href="/shop" className="text-xs font-semibold text-[#f85606] flex items-center hover:underline">
              Shop More <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {/* Flash Sale Horizontal Scroll */}
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {flashSaleItems.map((product, idx) => {
              const pId = product._id || product.id || idx;
              const price = product.flashPrice || product.sellingPrice || product.price || 0;
              const originalPrice = product.originalPrice || product.regularPrice || Math.round(price * 1.25);
              const discount = product.discountPercent || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 15);
              const stockLeft = product.stockLeft || Math.max(2, (idx * 3 + 4) % 15);

              const imageSrc = (() => {
                if (product.featuredImage) return product.featuredImage;
                let imgs = product.images;
                if (imgs) {
                  if (typeof imgs === 'string') {
                    try { imgs = JSON.parse(imgs); } catch (e) { return imgs; }
                  }
                  if (Array.isArray(imgs) && imgs[0]) return imgs[0];
                }
                return product.image || 'https://res.cloudinary.com/do56bvtzt/image/upload/v1791130599/stellar-mart/defaults/product_placeholder.webp';
              })();

              return (
                <Link
                  key={pId}
                  href={`/product/${product.slug || pId}`}
                  className="w-28 flex-shrink-0 flex flex-col group cursor-pointer touch-manipulation"
                >
                  <div className="relative w-28 h-28 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 mb-1.5 active:scale-95 transition-transform duration-200">
                    <Image
                      src={imageSrc}
                      alt={product.name || 'Flash sale product'}
                      fill
                      className="object-cover md:group-hover:scale-105 transition-transform duration-300"
                      sizes="112px"
                    />
                    {/* Red SAVE badge on top left */}
                    <div className="absolute top-0 left-0 bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-br-lg shadow-sm pointer-events-none">
                      SAVE {discount}%
                    </div>
                  </div>

                  <div className="px-0.5">
                    <div className="text-sm font-extrabold text-[#c2410c] leading-tight">
                      ৳{Number(price).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-500 line-through leading-none mt-0.5">
                      ৳{Number(originalPrice).toLocaleString()}
                    </div>
                    {/* Stock pill */}
                    <div className="mt-1.5 w-full bg-gradient-to-r from-red-600 to-rose-600 text-[9px] text-white font-bold py-0.5 px-1 rounded-full flex items-center justify-center gap-0.5 shadow-sm">
                      <span>🔥</span>
                      <span>{stockLeft} Stock left</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Popular Categories For You */}
      {categories.length > 0 && (
        <div className="bg-white mx-2.5 mt-3 p-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Popular Categories For You</h2>
            <Link href="/categories" aria-label="View all categories" className="text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center">
              Scroll More <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {categories.slice(0, 10).map((cat, idx) => {
              const catImg = cat.image || 'https://res.cloudinary.com/do56bvtzt/image/upload/v1791130600/stellar-mart/defaults/category_placeholder.webp';
              return (
                <Link
                  key={cat.id || cat.slug || idx}
                  href={`/category/${cat.slug}`}
                  className="w-20 flex-shrink-0 flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden relative shadow-sm group-active:scale-95 transition-transform duration-200">
                    {cat.icon_type === 'image' || cat.image ? (
                      <Image
                        src={catImg}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {cat.icon || '📦'}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 text-center line-clamp-1 mt-1.5 w-full">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Featured Products Section */}
      {featuredProducts && featuredProducts.length > 0 && (
        <div className="mx-2.5 mt-4">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-gray-900">Featured Products</h2>
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded-full tracking-wider shadow-sm animate-pulse">
                HOT
              </span>
            </div>
            <Link 
              href="/shop" 
              aria-label="View all featured products"
              className="text-xs font-semibold text-[#c2410c] flex items-center hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {featuredProducts.slice(0, 8).map((product, index) => (
              <ProductCard key={product._id || product.id || index} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Promo Banners */}
      <div className="mx-2.5 mt-4 grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-3 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-full inline-block mb-1">
              Super Sale
            </span>
            <h2 className="text-sm font-bold leading-tight">Super Sale</h2>
            <p className="text-[10px] text-pink-100 mt-0.5">Up to 50% off</p>
          </div>
          <Link 
            href="/shop" 
            aria-label="Shop Super Sale mobile products"
            className="relative z-10 mt-2.5 inline-block text-center py-1.5 px-3 bg-white text-rose-600 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform"
          >
            Shop Now
          </Link>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-3 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-full inline-block mb-1">
              Collection
            </span>
            <h2 className="text-sm font-bold leading-tight">New Trends</h2>
            <p className="text-[10px] text-purple-100 mt-0.5">Latest styles</p>
          </div>
          <Link 
            href="/shop" 
            aria-label="Shop New Trends collection mobile"
            className="relative z-10 mt-2.5 inline-block text-center py-1.5 px-3 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform"
          >
            Shop Now
          </Link>
        </div>
      </div>

      {/* 7. New Arrivals Section */}
      {newArrivals && newArrivals.length > 0 && (
        <div className="mx-2.5 mt-4">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-gray-900">New Arrivals</h2>
              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full tracking-wider shadow-sm">
                NEW
              </span>
            </div>
            <Link 
              href="/shop" 
              aria-label="View all new arrival products mobile"
              className="text-xs font-semibold text-[#c2410c] flex items-center hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {newArrivals.slice(0, 8).map((product, index) => (
              <ProductCard key={product._id || product.id || index} product={product} />
            ))}
          </div>
        </div>
      )}



    </div>
  );
}
