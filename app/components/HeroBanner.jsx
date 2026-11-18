'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const defaultFashionBanners = [
  {
    id: 'vestro-hero-1',
    title: 'VESTRO',
    subtitle: 'WEAR HOUSE',
    description: 'Streetwear and clothing. One flagship shop.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
    link: '/shop',
    ctaText: 'Shop all',
  },
  {
    id: 'vestro-hero-2',
    title: 'THE OVERSIZED DROP',
    subtitle: 'HEAVYWEIGHT ESSENTIALS',
    description: 'Crafted with 280-420 GSM French terry & combed cotton.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
    link: '/category/hoodies-sweats',
    ctaText: 'Shop hoodies',
  },
  {
    id: 'vestro-hero-3',
    title: 'RAW STREET SILHOUETTES',
    subtitle: 'NEW ARRIVALS 2026',
    description: 'Boxy fits, dropped shoulders, and urban durability.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
    link: '/new',
    ctaText: 'Explore new',
  },
];

const defaultQuickCategories = [
  {
    name: 'T-Shirt',
    slug: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sweatshirt',
    slug: 'hoodies-sweats',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Outerwear',
    slug: 'outerwear',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pants',
    slug: 'pants-cargo',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Caps',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&auto=format&fit=crop&q=80',
  },
];

function HeroBanner({ banners: incomingBanners = [], categories: incomingCategories = [], autoPlayInterval = 6000 }) {
  const banners = useMemo(() => {
    if (Array.isArray(incomingBanners) && incomingBanners.length > 0) {
      return incomingBanners
        .map((b) => ({
          id: b._id || b.id,
          title: b.title || 'VESTRO',
          subtitle: b.subtitle || 'WEAR HOUSE',
          description: b.description || 'Streetwear and clothing. One flagship shop.',
          image: b.image,
          link: b.link || '/shop',
          ctaText: b.button_text || 'Shop all',
        }))
        .filter((b) => Boolean(b.image));
    }
    return defaultFashionBanners;
  }, [incomingBanners]);

  const categoryBubbles = useMemo(() => {
    if (Array.isArray(incomingCategories) && incomingCategories.length > 0) {
      return incomingCategories.slice(0, 5).map((c) => ({
        name: c.name.split('&')[0].trim(),
        slug: c.slug,
        image: c.image || defaultQuickCategories[0].image,
      }));
    }
    return defaultQuickCategories;
  }, [incomingCategories]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [banners.length, autoPlayInterval]);

  const goToPrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const activeBanner = banners[currentSlide] || banners[0];

  return (
    <section className="w-full bg-white">
      {/* 1. Onfire-Style Trust Micro-Strip */}
      <div className="py-2.5 px-4 text-center border-b border-neutral-100 bg-white">
        <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-neutral-500 uppercase">
          SECURE CHECKOUT · DHAKA DISPATCH · EASY RETURNS
        </p>
      </div>

      {/* 2. Onfire-Style Circular Category Quick-Icons */}
      <div className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar py-1">
          {categoryBubbles.map((cat, idx) => (
            <Link
              key={cat.slug || idx}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 group shrink-0"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-neutral-200 group-hover:border-black group-hover:scale-105 transition-all duration-300 shadow-xs bg-neutral-100">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 60px, 80px"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-neutral-700 group-hover:text-black tracking-wider uppercase transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. The Onfire Split Hero Banner Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-14">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#161616] shadow-2xl border border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-[460px] lg:min-h-[520px]">
            
            {/* Left Side: Brand Identity & CTAs */}
            <div className="relative bg-[#161616] p-8 sm:p-12 md:p-14 lg:p-16 flex flex-col justify-center text-white overflow-hidden">
              {/* Subtle V-mark background watermark */}
              <div className="absolute right-[-15%] bottom-[-15%] w-[320px] h-[320px] pointer-events-none opacity-[0.04] select-none text-white">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                  <path d="M15 15 L50 90 L85 15 L65 15 L50 60 L35 15 Z" />
                </svg>
              </div>

              {/* Tagline */}
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-neutral-400 uppercase mb-2 sm:mb-3 block">
                BANGLADESH
              </span>

              {/* Main Brand Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
                VESTRO
              </h1>

              {/* Sub-label */}
              <p className="text-xs sm:text-sm font-bold tracking-[0.32em] uppercase text-neutral-400 mt-1 mb-4 sm:mb-5">
                WEAR HOUSE
              </p>

              {/* Tagline / Subtitle */}
              <p className="text-xs sm:text-sm text-neutral-300 max-w-sm mb-6 sm:mb-8 leading-relaxed font-normal">
                {activeBanner.description || 'Shoes and clothing. One shop.'}
              </p>

              {/* Dual Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 z-10">
                <Link
                  href="/shop"
                  className="px-6 sm:px-7 py-3 rounded-full bg-white text-black text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-neutral-200 active:scale-95 transition-all text-center shadow-md cursor-pointer"
                >
                  Shop all
                </Link>
                <Link
                  href="/new"
                  className="px-6 sm:px-7 py-3 rounded-full border border-neutral-600 hover:border-white text-white text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all text-center cursor-pointer"
                >
                  New arrival
                </Link>
              </div>
            </div>

            {/* Right Side: Streetwear Model Photograph */}
            <div className="relative min-h-[380px] md:min-h-full w-full overflow-hidden bg-neutral-900">
              {banners.map((b, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <div
                    key={b.id || idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                    }`}
                  >
                    <Image
                      src={b.image}
                      alt={b.title || 'Vestro Streetwear Apparel'}
                      fill
                      priority={idx === 0}
                      className="object-cover object-top md:object-center"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                );
              })}

              {/* Sleek Carousel Indicators & Controls */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                  <button
                    onClick={goToPrev}
                    aria-label="Previous slide"
                    className="text-white/70 hover:text-white transition-colors p-0.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 px-1">
                    {banners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        aria-label={`Slide ${i + 1}`}
                        className={`block rounded-full transition-all cursor-pointer ${
                          i === currentSlide ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={goToNext}
                    aria-label="Next slide"
                    className="text-white/70 hover:text-white transition-colors p-0.5 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroBanner);
