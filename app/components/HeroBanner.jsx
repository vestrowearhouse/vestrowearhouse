'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const defaultFashionBanners = [
  {
    id: 'fashion-hero-1',
    title: 'NEW COLLECTION 2026',
    subtitle: 'CONTEMPORARY STREETWEAR & APPAREL',
    description: 'Discover minimal silhouettes, relaxed fits, and crafted fabric essentials.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
    link: '/shop',
    ctaText: 'EXPLORE COLLECTION',
  },
  {
    id: 'fashion-hero-2',
    title: 'THE OVERSIZED DROP',
    subtitle: 'URBAN ESSENTIALS & DROP SHOULDER',
    description: 'Engineered for comfort and modern aesthetic. 100% Cotton & French Terry.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop',
    link: '/category/t-shirts',
    ctaText: 'SHOP OVERSIZED',
  },
  {
    id: 'fashion-hero-3',
    title: 'HOODIES & SWEATSHIRTS',
    subtitle: 'PREMIUM COZY LAYERS',
    description: 'Stay warm with heavyweight fleece and structured street silhouettes.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1600&auto=format&fit=crop',
    link: '/category/hoodies',
    ctaText: 'SHOP HOODIES',
  },
];

function HeroBanner({ banners: incomingBanners = [], autoPlayInterval = 5000 }) {
  const banners = useMemo(() => {
    if (Array.isArray(incomingBanners) && incomingBanners.length > 0) {
      return incomingBanners
        .map((b) => ({
          id: b._id || b.id,
          title: b.title || 'NEW ARRIVALS',
          subtitle: 'VESTRO WEAR HOUSE',
          description: b.description || 'Explore the latest trendsetting street drops and casual apparel.',
          image: b.image,
          link: b.link || '/shop',
          ctaText: 'SHOP NOW →',
        }))
        .filter((b) => Boolean(b.image));
    }
    return defaultFashionBanners;
  }, [incomingBanners]);

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
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = (e) => {
    e.preventDefault();
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentSlide] || banners[0];

  return (
    <section className="relative w-full bg-neutral-900 overflow-hidden">
      <div className="relative w-full h-[380px] sm:h-[460px] md:h-[560px] lg:h-[620px]">
        {banners.map((banner, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={banner.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <Link href={banner.link} className="relative block w-full h-full">
                {/* Background Banner Image */}
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  priority={index === 0}
                  className="object-cover object-center brightness-[0.85] transition-transform duration-7000 ease-out scale-100 hover:scale-105"
                  sizes="100vw"
                />

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/40 sm:to-transparent" />

                {/* Hero Text Content */}
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-5 sm:px-10 w-full">
                    <div className="max-w-xl text-white">
                      {banner.subtitle && (
                        <p className="text-[11px] sm:text-[13px] font-bold tracking-[0.24em] uppercase text-neutral-300 mb-2 sm:mb-3">
                          {banner.subtitle}
                        </p>
                      )}
                      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[1.1] mb-2 sm:mb-4">
                        {banner.title}
                      </h1>
                      {banner.description && (
                        <p className="text-xs sm:text-sm md:text-base text-neutral-300 leading-relaxed mb-5 sm:mb-7 line-clamp-2 max-w-md">
                          {banner.description}
                        </p>
                      )}
                      <div>
                        <span className="inline-block py-2.5 sm:py-3.5 px-6 sm:px-8 bg-white text-black font-bold text-xs sm:text-sm uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all shadow-md">
                          {banner.ctaText || 'EXPLORE COLLECTION'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Carousel Arrow Controls */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              aria-label="Previous Slide"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={goToNext}
              aria-label="Next Slide"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-20 flex justify-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setCurrentSlide(i); }}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 transition-all rounded-full cursor-pointer ${
                    i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default memo(HeroBanner);
