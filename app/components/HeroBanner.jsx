'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Curated high-res fallback banners (served locally from /banners for 100% reliability & instant loading)
const defaultMainBanners = [
  {
    id: 'default-main-1',
    title: 'Pro Gaming Gear',
    description: 'Keyboards, Mice & Accessories • 100% Cash On Delivery',
    image: '/banners/default_banner_1.webp',
    link: '/shop',
    position: 0,
  },
  {
    id: 'default-main-2',
    title: 'Desk Setup Essentials',
    description: 'Level Up Your Battlestation with Premium Accessories',
    image: '/banners/default_banner_2.webp',
    link: '/shop',
    position: 1,
  },
  {
    id: 'default-main-3',
    title: 'সারা দেশে ক্যাশ অন ডেলিভারি',
    description: 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন • ৭ দিনের সহজ রিটার্ন',
    image: '/banners/default_banner_3.webp',
    link: '/shop',
    position: 2,
  },
];

const defaultSideTopBanner = {
  id: 'default-side-top',
  title: 'Mobile Gaming',
  description: 'Finger Sleeves, Coolers & Triggers',
  image: '/banners/default_banner_4.webp',
  link: '/shop',
  position: 100,
};

const defaultSideBottomBanner = {
  id: 'default-side-bottom',
  title: 'দ্রুত হোম ডেলিভারি',
  description: 'ঢাকার ভিতরে ২৪-৪৮ ঘণ্টায় ক্যাশ অন ডেলিভারি',
  image: '/banners/default_banner_5.webp',
  link: '/delivery-policy',
  position: 200,
};

function HeroBanner({ banners: incomingBanners = [], autoPlayInterval = 5000 }) {
  const { mainBanners, sideTopBanner, sideBottomBanner } = useMemo(() => {
    const rawBanners = Array.isArray(incomingBanners) && incomingBanners.length > 0 ? incomingBanners : [];

    const mapped = rawBanners
      .map((banner) => ({
        id: banner._id || banner.id,
        title: banner.title || '',
        description: banner.description || '',
        image: banner.image,
        link: banner.link || '/shop',
        position: banner.position !== undefined && banner.position !== null ? Number(banner.position) : 0,
      }))
      .filter((banner) => Boolean(banner.image));

    let main = mapped.filter((b) => b.position < 100);
    if (main.length === 0) {
      main = defaultMainBanners;
    }

    const sideTop = mapped.find((b) => b.position === 100) || defaultSideTopBanner;
    const sideBottom = mapped.find((b) => b.position === 200) || defaultSideBottomBanner;

    return { mainBanners: main, sideTopBanner: sideTop, sideBottomBanner: sideBottom };
  }, [incomingBanners]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCurrentSlide(0);
  }, [mainBanners.length]);

  useEffect(() => {
    if (mainBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [mainBanners.length, autoPlayInterval]);

  const goToSlide = (index) => setCurrentSlide(index);
  const goToPrev = () => setCurrentSlide((prev) => (prev - 1 + mainBanners.length) % mainBanners.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % mainBanners.length);

  return (
    <section className="py-3 md:py-5 bg-[#f6f7fb]">
      <div className="max-w-7xl mx-auto px-2 md:px-4">
        {/* Desktop: 3-Column Grid / Mobile: Single column */}
        <div className="md:grid md:grid-cols-3 md:gap-4">
          {/* Left - Main Carousel */}
          <div className="md:col-span-2 relative h-[250px] md:h-[400px] rounded-xl md:rounded-2xl overflow-hidden group bg-gray-200 shadow-sm">
            {mainBanners.map((banner, index) => {
              const hasText = Boolean(banner.title?.trim() || banner.description?.trim());
              return (
                <div
                  key={banner.id || index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <Link href={banner.link || '/shop'} prefetch={false} className="relative block h-full w-full">
                    <Image
                      src={banner.image}
                      alt={banner.title || 'Banner'}
                      fill
                      priority={index === 0}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                    {hasText && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
                        <div className="absolute inset-0 flex items-center">
                          <div className="p-5 md:p-8 max-w-lg">
                            {banner.title?.trim() && (
                              <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2 md:mb-3 drop-shadow-md">
                                {banner.title}
                              </h2>
                            )}
                            {banner.description?.trim() && (
                              <p className="text-xs md:text-base text-white/90 mb-3 md:mb-5 drop-shadow">
                                {banner.description}
                              </p>
                            )}
                            <span className="inline-block px-4 md:px-6 py-2 bg-white text-gray-900 font-bold rounded-lg hover:bg-amber-400 hover:text-black transition-colors text-xs md:text-sm shadow-md">
                              Shop Now →
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </Link>
                </div>
              );
            })}

            {/* Navigation Arrows */}
            {mainBanners.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  type="button"
                  aria-label="Previous banner"
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white z-10"
                >
                  <ChevronLeft className="w-4 md:w-5 h-4 md:h-5 text-gray-800" />
                </button>
                <button
                  onClick={goToNext}
                  type="button"
                  aria-label="Next banner"
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white z-10"
                >
                  <ChevronRight className="w-4 md:w-5 h-4 md:h-5 text-gray-800" />
                </button>

                {/* Slider Dots */}
                <div className="absolute bottom-2.5 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
                  {mainBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      type="button"
                      aria-label={`Go to slide ${index + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSlide
                          ? 'bg-white w-5 md:w-7 shadow-sm'
                          : 'w-2 bg-white/60 hover:bg-white/90'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right - Side Banners (Top & Bottom) */}
          <div className="hidden md:flex flex-col gap-4 md:h-[400px]">
            {/* Top Side Banner */}
            <Link
              href={sideTopBanner.link || '/shop'}
              prefetch={false}
              className="relative flex-1 min-h-0 rounded-2xl overflow-hidden group bg-gray-200 block shadow-sm hover:shadow-md transition-shadow"
            >
              <Image
                src={sideTopBanner.image}
                alt={sideTopBanner.title || 'Side Banner'}
                fill
                loading="eager"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 0vw, 33vw"
              />
              {Boolean(sideTopBanner.title?.trim() || sideTopBanner.description?.trim()) ? (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-5">
                  {sideTopBanner.title?.trim() && (
                    <h2 className="text-lg md:text-xl font-bold text-white mb-1 drop-shadow">
                      {sideTopBanner.title}
                    </h2>
                  )}
                  {sideTopBanner.description?.trim() && (
                    <p className="text-white/90 text-xs md:text-sm font-medium drop-shadow">
                      {sideTopBanner.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              )}
            </Link>

            {/* Bottom Side Banner */}
            <Link
              href={sideBottomBanner.link || '/shop'}
              prefetch={false}
              className="relative flex-1 min-h-0 rounded-2xl overflow-hidden group bg-gray-200 block shadow-sm hover:shadow-md transition-shadow"
            >
              <Image
                src={sideBottomBanner.image}
                alt={sideBottomBanner.title || 'Side Banner'}
                fill
                loading="eager"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 0vw, 33vw"
              />
              {Boolean(sideBottomBanner.title?.trim() || sideBottomBanner.description?.trim()) ? (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-5">
                  {sideBottomBanner.title?.trim() && (
                    <h2 className="text-lg md:text-xl font-bold text-white mb-1 drop-shadow">
                      {sideBottomBanner.title}
                    </h2>
                  )}
                  {sideBottomBanner.description?.trim() && (
                    <p className="text-white/90 text-xs md:text-sm font-medium drop-shadow">
                      {sideBottomBanner.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroBanner);

