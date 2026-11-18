'use client';

import { memo, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const defaultFashionBanners = [
  {
    id: 'vestro-hero-1',
    badge: 'NEW DROP 2026 // DHAKA FLAGSHIP',
    title: 'RAW STREET SILHOUETTES',
    subtitle: 'OVERSIZED ESSENTIALS & APPAREL',
    description: 'Crafted with heavyweight 380-420 GSM French terry, boxy fits, and relaxed streetwear cuts.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1920&auto=format&fit=crop',
    link: '/shop',
    primaryCta: 'EXPLORE COLLECTION',
    secondaryCta: 'NEW ARRIVALS',
    secondaryLink: '/new',
  },
  {
    id: 'vestro-hero-2',
    badge: 'LIMITED EDITION // AUTUMN / WINTER',
    title: 'THE OVERSIZED HOODIE',
    subtitle: 'PREMIUM STREET LAYERS',
    description: 'Uncompromised comfort engineered with dense cotton fleece and clean minimal branding.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1920&auto=format&fit=crop',
    link: '/category/hoodies-sweats',
    primaryCta: 'SHOP HOODIES',
    secondaryCta: 'VIEW ALL',
    secondaryLink: '/shop',
  },
  {
    id: 'vestro-hero-3',
    badge: 'VESTRO ARCHIVE // URBAN WEAR',
    title: 'CONTEMPORARY UTILITY',
    subtitle: 'CARGOS, TEES & JACKETS',
    description: 'Minimal aesthetic built for daily rotation. Designed in Bangladesh for global streetwear culture.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop',
    link: '/category/t-shirts',
    primaryCta: 'SHOP TEES',
    secondaryCta: 'ALL COLLECTIONS',
    secondaryLink: '/shop',
  },
];

function HeroBanner({ banners: incomingBanners = [], autoPlayInterval = 6000 }) {
  const banners = useMemo(() => {
    if (Array.isArray(incomingBanners) && incomingBanners.length > 0) {
      return incomingBanners
        .map((b) => ({
          id: b._id || b.id,
          badge: b.badge || 'VESTRO WEAR HOUSE // DHAKA',
          title: b.title || 'RAW STREET SILHOUETTES',
          subtitle: b.subtitle || 'OVERSIZED ESSENTIALS',
          description: b.description || 'Discover modern streetwear, relaxed fits, and crafted fabric essentials.',
          image: b.image,
          link: b.link || '/shop',
          primaryCta: b.button_text || 'EXPLORE COLLECTION',
          secondaryCta: 'NEW ARRIVALS',
          secondaryLink: '/new',
        }))
        .filter((b) => Boolean(b.image));
    }
    return defaultFashionBanners;
  }, [incomingBanners]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(null);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [banners.length, autoPlayInterval, isPaused]);

  const goToPrev = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (diff > 50) {
      goToNext();
    } else if (diff < -50) {
      goToPrev();
    }
    touchStartXRef.current = null;
  };

  const activeBanner = banners[currentSlide] || banners[0];

  return (
    <section className="w-full bg-white pt-2 sm:pt-4 pb-6 sm:pb-10">
      <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-8">
        <div 
          className="relative w-full h-[520px] sm:h-[580px] lg:h-[640px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-neutral-900/10 bg-neutral-950 group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background Images with Cross-Fade */}
          {banners.map((banner, idx) => {
            const isActive = idx === currentSlide;
            return (
              <div
                key={banner.id || idx}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
                }`}
              >
                <Image
                  src={banner.image}
                  alt={banner.title || 'Vestro Streetwear Banner'}
                  fill
                  priority={idx === 0}
                  className="object-cover object-center"
                  sizes="(max-width: 1480px) 100vw, 1480px"
                />

                {/* Multi-layered Cinematic Gradients for Ultra-Crisp Typography Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent sm:w-3/4" />
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 pointer-events-none" />
              </div>
            );
          })}

          {/* Foreground Hero Content */}
          <div className="relative z-20 h-full w-full flex flex-col justify-end p-6 sm:p-10 md:p-14 lg:p-16 max-w-3xl text-white">
            
            {/* Top Micro Kicker Badge */}
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-neutral-300 uppercase">
                {activeBanner.badge || 'VESTRO WEAR HOUSE // BANGLADESH'}
              </span>
            </div>

            {/* Massive Bold Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-[1.05] drop-shadow-md mb-2 sm:mb-3">
              {activeBanner.title}
            </h1>

            {/* Subtitle / Drop Label */}
            {activeBanner.subtitle && (
              <p className="text-xs sm:text-sm font-bold tracking-[0.24em] uppercase text-neutral-300 mb-3 sm:mb-4">
                {activeBanner.subtitle}
              </p>
            )}

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-neutral-300 max-w-xl font-normal leading-relaxed mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3">
              {activeBanner.description}
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href={activeBanner.link || '/shop'}
                className="px-6 sm:px-8 py-3.5 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer group/btn"
              >
                <span>{activeBanner.primaryCta || 'EXPLORE COLLECTION'}</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={activeBanner.secondaryLink || '/new'}
                className="px-6 sm:px-7 py-3.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/40 hover:border-white text-white active:scale-95 text-xs sm:text-sm font-semibold uppercase tracking-wider backdrop-blur-md transition-all text-center cursor-pointer"
              >
                {activeBanner.secondaryCta || 'NEW ARRIVALS'}
              </Link>
            </div>
          </div>

          {/* Left / Right Arrow Controls */}
          {banners.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                aria-label="Previous slide"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/80 border border-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 cursor-pointer shadow-lg"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={goToNext}
                aria-label="Next slide"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/80 border border-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 cursor-pointer shadow-lg"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Sleek Bottom Bar with Modern Dash Indicators & Slide Counter */}
          {banners.length > 1 && (
            <div className="absolute bottom-5 sm:bottom-8 right-5 sm:right-10 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/15">
              <span className="text-[11px] font-mono font-bold text-white tracking-widest pl-1">
                {String(currentSlide + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}
              </span>

              <div className="h-3 w-px bg-white/20 mx-1" />

              <div className="flex items-center gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === currentSlide 
                        ? 'w-6 sm:w-8 bg-white' 
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(HeroBanner);
