'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { normalizeId } from '@/lib/normalizeId';

// Lazy-load BuyNowModal
const BuyNowModal = dynamic(() => import('./BuyNowModal'), { ssr: false });

function ProductCard({ product }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const router = useRouter();

  // Helper for numeric price
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

  // 2. Original regular price
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
    name: product?.name || 'Vestro Apparel',
    description: product?.description || '',
    category: product?.category?.name || (typeof product?.category === 'string' ? product.category : '') || '',
    image: (() => {
      if (product?.featuredImage) return product.featuredImage;
      let imgs = product?.images;
      if (imgs) {
        if (typeof imgs === 'string') {
          try { imgs = JSON.parse(imgs); } catch { return imgs; }
        }
        if (Array.isArray(imgs) && imgs[0]) return imgs[0];
      }
      return product?.image || product?.image_url || '/placeholder.png';
    })(),
    price: price,
    originalPrice: originalPrice,
    discount: calculatedDiscount,
    inStock: (() => {
      if (!product) return true;
      if (product.stockStatus === 'out_of_stock') return false;
      const baseStock = Math.max(
        Number(product.stockQuantity ?? 0),
        Number(product.stock ?? 0)
      );
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        return product.variants.some(v => v.status !== 'inactive' && Number(v.stock ?? 1) > 0);
      }
      return baseStock > 0 || (product.stockStatus === 'in_stock');
    })(),
  };

  const isWishlisted = isInWishlist(item._id);

  // Check if product requires option/variant selection (e.g. Size, Color)
  const hasOptions = (() => {
    let attrs = product?.attributes;
    if (typeof attrs === 'string') {
      try { attrs = JSON.parse(attrs); } catch { attrs = []; }
    }
    if (Array.isArray(attrs) && attrs.length > 0) return true;

    let vars = product?.variants;
    if (typeof vars === 'string') {
      try { vars = JSON.parse(vars); } catch { vars = []; }
    }
    if (Array.isArray(vars) && vars.length > 1) return true;
    return false;
  })();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.inStock) return;

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
      alert(res?.message || 'Failed to add to bag');
    }
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.inStock) return;

    if (hasOptions) {
      router.push(`/product/${item.slug || item._id}`);
      return;
    }

    setIsBuyNowOpen(true);
  };

  const handleDirectOrder = () => {
    if (hasOptions) {
      router.push(`/product/${item.slug || item._id}`);
      return;
    }
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

  return (
    <div className="group relative flex flex-col h-full select-none">
      
      {/* 1. Media Container (Onfire 3:4 portrait ratio) */}
      <div className="relative mb-2.5 sm:mb-3 aspect-[3/4] w-full overflow-hidden bg-neutral-100">
        <Link href={`/product/${item.slug}`} className="block w-full h-full relative">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            className="object-cover h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Badge: New or Sale (Onfire minimal pill badge) */}
        {item.discount > 0 ? (
          <span className="absolute left-2.5 top-2.5 bg-neutral-900 text-white px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            -{item.discount}%
          </span>
        ) : product?.isNewArrival ? (
          <span className="absolute left-2.5 top-2.5 bg-white/95 text-neutral-900 border border-neutral-200/60 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-xs">
            New
          </span>
        ) : null}

        {/* Wishlist Heart Icon */}
        <button
          onClick={toggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2.5 top-2.5 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs flex items-center justify-center text-neutral-600 hover:text-black transition-all shadow-xs cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Out of Stock Overlay */}
        {!item.inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 pointer-events-none">
            <span className="bg-black text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1 shadow-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* Desktop Quick Buy Slide-up bar (Onfire style) */}
        {item.inStock && (
          <div className="hidden lg:block absolute inset-x-0 bottom-0 p-2 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <div className="grid grid-cols-2 gap-1.5 bg-white/95 backdrop-blur-xs p-1 shadow-md">
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="py-2 px-1 text-[11px] font-bold tracking-wider uppercase text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                <span>{isAdded ? 'Added' : 'Bag'}</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="py-2 px-1 text-[11px] font-bold tracking-wider uppercase text-white bg-black hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Product Details */}
      <div className="flex flex-col flex-1">
        <Link href={`/product/${item.slug}`} className="block group">
          <h3 className="text-[13px] sm:text-[14px] font-medium leading-snug text-neutral-900 group-hover:underline line-clamp-2 mb-1">
            {item.name}
          </h3>
          <div className="flex flex-wrap items-baseline gap-x-2 text-[14px] sm:text-[15px]">
            <span className="font-bold text-neutral-900">
              ৳ {item.price.toLocaleString()}
            </span>
            {item.originalPrice > item.price && (
              <span className="text-[12px] sm:text-[13px] text-neutral-600 line-through font-normal">
                ৳ {item.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </Link>

        {/* Mobile Quick Add / Buy Button */}
        <div className="lg:hidden mt-2 pt-1">
          {item.inStock ? (
            <button
              onClick={handleBuyNow}
              className="w-full py-1.5 bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-wider text-center"
            >
              Order Now
            </button>
          ) : (
            <div className="w-full py-1.5 bg-neutral-100 text-neutral-400 text-[11px] font-bold uppercase tracking-wider text-center">
              Sold Out
            </div>
          )}
        </div>
      </div>

      {/* Buy Now Modal */}
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
