'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Loader2, Store, ShieldCheck } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { normalizeId } from '@/lib/normalizeId';

// BuyNowModal (14KB) is only needed when user clicks "Buy Now" — lazy load it
const BuyNowModal = dynamic(() => import('./BuyNowModal'), { ssr: false });


function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const { addToCart, clearCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const router = useRouter();

  // Properly resolve selling price and original price, ignoring 0 or invalid values
  const getNum = (v) => {
    const n = Number(v);
    return !isNaN(n) && n > 0 ? n : 0;
  };

  // 1. Current selling price
  const price = 
    getNum(product?.sellingPrice) ||
    getNum(product?.selling_price) ||
    getNum(product?.price) ||
    getNum(product?.regularPrice) ||
    getNum(product?.regular_price) ||
    getNum(product?.oldPrice) ||
    getNum(product?.originalPrice) ||
    (Array.isArray(product?.variants) && product.variants.length > 0 
      ? (getNum(product.variants[0]?.sellingPrice) || getNum(product.variants[0]?.price) || 0)
      : 0);

  // 2. Original regular price (for strikethrough discount display)
  const candidateOriginal = 
    getNum(product?.oldPrice) ||
    getNum(product?.originalPrice) ||
    getNum(product?.original_price) ||
    getNum(product?.regularPrice) ||
    getNum(product?.regular_price) ||
    0;

  const originalPrice = candidateOriginal > price ? candidateOriginal : (candidateOriginal || price);
  
  let calculatedDiscount = Number(product?.discountPercent || product?.discount || 0);
  if (!calculatedDiscount && originalPrice > price && price > 0) {
    calculatedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  const pId = normalizeId(product);

  const item = {
    _id: pId,
    id: pId,
    slug: product?.slug || pId || '',
    name: product?.name || 'Product',
    description: product?.description || product?.shortDescription || '',
    category: product?.category?.name || (typeof product?.category === 'string' ? product.category : '') || '',
    image: (() => {
      if (product?.featuredImage) return product.featuredImage;
      let imgs = product?.images;
      if (imgs) {
        if (typeof imgs === 'string') {
          try { imgs = JSON.parse(imgs); } catch (e) { return imgs; }
        }
        if (Array.isArray(imgs) && imgs[0]) return imgs[0];
      }
      return product?.image || product?.image_url || '/placeholder.png';
    })(),
    price: price,
    originalPrice: originalPrice,
    rating: Number(product?.rating || 0),
    reviewCount: Number(product?.review_count || product?.reviewCount || 0),
    inStock: (() => {
      if (!product) return true;
      if (product.stockStatus === 'out_of_stock') return false;
      const hasStockField = (product.stock !== undefined && product.stock !== null) ||
                            (product.stockQuantity !== undefined && product.stockQuantity !== null);
      const baseStock = Math.max(
        Number(product.stockQuantity ?? 0),
        Number(product.stock ?? 0)
      );
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        return product.variants.some(v => v.status !== 'inactive' && Number(v.stock ?? (hasStockField ? baseStock : 1)) > 0);
      }
      if (hasStockField && baseStock <= 0) return false;
      if (product.stockStatus === 'in_stock') return true;
      return hasStockField ? baseStock > 0 : true;
    })(),
    storeName: (!product?.vendor_id || product?.vendor_id === 'official')
      ? 'StellarMart Official'
      : (product?.store_name || product?.vendor?.shop_name || 'Vendor Store'),
    isOfficial: !product?.vendor_id || product?.vendor_id === 'official' ? (product?.is_official !== false) : false,
    vendorId: product?.vendor?.id || product?.vendor_id || null,
    soldCount: Number(product?.sold_count || product?.soldCount || product?.total_sold || 0),
    get soldCountFormatted() {
      if (this.soldCount >= 1000) return (this.soldCount / 1000).toFixed(1).replace('.0', '') + 'k';
      return String(this.soldCount);
    }
  };

  const isWishlisted = isInWishlist(item._id);

  // Check if product requires option/variant selection (e.g. Size, Color)
  const hasOptions = (() => {
    let attrs = product?.attributes;
    if (typeof attrs === 'string') {
      try { attrs = JSON.parse(attrs); } catch (e) { attrs = []; }
    }
    if (Array.isArray(attrs) && attrs.length > 0) return true;

    let vars = product?.variants;
    if (typeof vars === 'string') {
      try { vars = JSON.parse(vars); } catch (e) { vars = []; }
    }
    if (Array.isArray(vars) && vars.length > 1) return true;
    return false;
  })();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents link navigation when clicking button
    if (!item.inStock) return;

    // If product has size/color options, redirect to product page so user selects them
    if (hasOptions) {
      router.push(`/product/${item.slug || item._id}`);
      return;
    }
    
    setIsAdding(true);
    
    const res = await addToCart(item, 1);
    
    setIsAdding(false);
    
    if (res?.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } else {
      alert(res?.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!item.inStock) return;

    // If product has size/color options, redirect to product page so user selects them
    if (hasOptions) {
      router.push(`/product/${item.slug || item._id}`);
      return;
    }

    setIsBuyNowOpen(true);
  };

  const handleDirectOrder = () => {
    // If product has options, always go to product details first
    if (hasOptions) {
      router.push(`/product/${item.slug || item._id}`);
      return;
    }
    // Redirect directly to checkout with the product ID and quantity
    router.push(`/checkout?buyNow=${item._id}&qty=1&source=direct`);
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      await removeFromWishlist(item._id);
    } else {
      await addToWishlist({
        _id: item._id,
        id: item._id,
        name: item.name,
        slug: item.slug,
        image: item.image,
        price: item.price,
        originalPrice: item.originalPrice,
        inStock: item.inStock
      });
    }
  };

  const handleCardClick = (e) => {
    // If clicking a button, let it handle its own action
    if (e.target.closest('button')) {
      return;
    }
    // If clicking an existing anchor, Next.js Link will handle navigation
    if (e.target.closest('a')) {
      return;
    }
    if (item.slug) {
      router.push(`/product/${item.slug}`);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl md:rounded-[15px] overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.06)] md:shadow-[0_10px_25px_rgba(0,0,0,0.1)] transition-all duration-300 md:hover:-translate-y-[8px] md:hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)] active:scale-[0.98] flex flex-col h-full relative group cursor-pointer md:cursor-default touch-manipulation select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Image Section */}
      <div className="relative w-full aspect-square overflow-hidden bg-[#f5f7fa]">
        {item.discount > 0 && (
          <span className="absolute top-2 left-2 md:top-[10px] md:left-[10px] bg-[#b91c1c] text-white px-1.5 py-0.5 md:px-[8px] md:py-[4px] text-[10px] md:text-[11px] font-bold rounded shadow-sm z-10 pointer-events-none">
            -{item.discount}%
          </span>
        )}
        
        {/* Wishlist Button */}
        <button 
          onClick={toggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2 right-2 md:top-[10px] md:right-[10px] z-20 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-white/80 hover:bg-white backdrop-blur-sm rounded-full text-gray-500 hover:text-rose-500 transition-all duration-300 shadow-sm cursor-pointer"
        >
          <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} aria-hidden="true" />
        </button>

        <Link href={`/product/${item.slug}`} tabIndex={-1} aria-hidden="true" className="relative block w-full h-full z-0">
          <Image
            src={item.image}
            alt={item.name}
            fill
            loading="lazy"
            quality={75}
            className="object-contain p-2 sm:p-3 md:p-4 transition-transform duration-[400ms] md:group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </Link>
        
        {/* Out of Stock Overlay */}
        {!item.inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 pointer-events-none">
            <span className="bg-gray-900 text-white text-xs md:text-sm font-semibold px-2.5 py-1 md:px-3 rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* 2. Product Info Section */}
      <div className="p-2.5 sm:p-3 md:p-[15px] flex flex-col flex-grow">
        <Link href={`/product/${item.slug}`} className="block flex-col flex-grow">
          <div className="text-xs sm:text-sm md:text-[18px] font-medium md:font-semibold mb-1 md:mb-[6px] text-gray-800 line-clamp-2 leading-snug md:leading-tight h-8 sm:h-9 md:h-[44px]">
            {item.name}
          </div>

          {/* Store Attribution Tag */}
          <div className="flex items-center gap-1 mb-1.5">
            {item.isOfficial ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3 text-blue-600" /> StellarMart Official
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/70 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                <Store className="w-3 h-3 text-purple-600 shrink-0" /> <span className="truncate">{item.storeName}</span>
              </span>
            )}
          </div>

          {/* Price Section */}
          <div className="mb-1 md:mb-[8px] flex items-baseline flex-wrap gap-1">
            <span className="text-sm sm:text-base md:text-[20px] font-bold text-[#c2410c] md:text-[#15803d]">
              ৳{item.price.toLocaleString('en-IN')}
            </span>
            {item.originalPrice > item.price && (
              <span className="text-[11px] sm:text-xs md:text-[14px] line-through text-gray-500 md:text-[#52525b] ml-1 md:ml-[8px]">
                ৳{item.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          
          {/* Desktop Stars Rating + Sold Count */}
          <div className="hidden md:flex items-center justify-between text-[12px] mb-2 min-h-[18px]">
            {item.rating > 0 ? (
              <div className="flex items-center tracking-wide">
                <span className="text-[#f1c40f]">
                  {'★'.repeat(Math.round(item.rating)) + '☆'.repeat(5 - Math.round(item.rating))}
                </span>
                <span className="text-gray-700 font-semibold ml-1 font-sans text-[11px]">{item.rating.toFixed(1)}</span>
                {item.reviewCount > 0 && (
                  <span className="text-gray-400 font-normal text-[11px] ml-0.5">({item.reviewCount})</span>
                )}
              </div>
            ) : (
              <div className="flex items-center text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                <span>✓ Verified Authentic</span>
              </div>
            )}
            {item.soldCount > 0 && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded leading-none">
                {item.soldCountFormatted} sold
              </span>
            )}
          </div>

          {/* Mobile Rating + Sold Count (compact) */}
          <div className="flex md:hidden items-center justify-between text-[11px] text-gray-500 mb-1 min-h-[16px]">
            {item.rating > 0 ? (
              <div className="flex items-center gap-1">
                <span className="text-[#f1c40f]">★</span>
                <span className="font-semibold text-gray-700">{item.rating.toFixed(1)}</span>
                {item.reviewCount > 0 && (
                  <span className="text-gray-400">({item.reviewCount})</span>
                )}
              </div>
            ) : (
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                ✓ Authentic
              </span>
            )}
            {item.soldCount > 0 && (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded leading-none">
                {item.soldCountFormatted} sold
              </span>
            )}
          </div>
        </Link>

        {/* 3. Buttons Section - ONLY visible on PC / Desktop (md and above) */}
        <div className="mt-auto hidden md:block">
          {item.inStock ? (
            <>
              <button 
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`w-full p-[12px] border-none rounded-[8px] cursor-pointer text-[14px] transition-colors duration-300 text-white mb-[10px] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isAdded ? 'bg-[#15803d] hover:bg-[#166534]' : 'bg-[#0066cc] hover:bg-[#0052a3]'}`}
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isAdding ? 'Adding...' : isAdded ? 'Added to Cart ✓' : 'Add to Cart'}
              </button>
              
              <button 
                onClick={handleBuyNow}
                className="w-full p-[12px] border-none rounded-[8px] cursor-pointer text-[15px] transition-all duration-300 bg-[#15803d] hover:bg-[#166534] hover:scale-[1.03] text-white font-bold flex justify-center items-center"
              >
                {hasOptions ? 'Select Options' : 'Buy Now'}
              </button>
            </>
          ) : (
            <div className="w-full p-[12px] border-2 border-red-100 rounded-[8px] text-[15px] font-bold bg-red-50 text-red-700 flex justify-center items-center cursor-not-allowed">
              Out of Stock
            </div>
          )}
        </div>
      </div>

      {/* Buy Now Option Modal (WhatsApp & Direct Order) */}
      <BuyNowModal
        isOpen={isBuyNowOpen}
        onClose={() => setIsBuyNowOpen(false)}
        product={item}
        quantity={1}
        onDirectOrder={handleDirectOrder}
      />
    </div>
  );
}

export default memo(ProductCard);
