'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

export default function NewAndPopularSection({ products = [], categories = [] }) {
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Filter categories that have products or take first 5
  const filterTabs = useMemo(() => {
    const list = ['ALL'];
    if (Array.isArray(categories) && categories.length > 0) {
      categories.slice(0, 5).forEach((c) => {
        if (c.name && !list.includes(c.name.toUpperCase())) {
          list.push(c.name.toUpperCase());
        }
      });
    }
    return list;
  }, [categories]);

  // Filter products by selected category tab
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'ALL') {
      return products.slice(0, 16);
    }
    return products.filter((p) => {
      const catName = (p.category?.name || (typeof p.category === 'string' ? p.category : '') || p.category_name || '').toUpperCase();
      return catName.includes(activeCategory) || activeCategory.includes(catName);
    }).slice(0, 16);
  }, [products, activeCategory]);

  const displayList = filteredProducts.length > 0 ? filteredProducts : products.slice(0, 16);

  return (
    <section className="py-8 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Onfire Section Heading with Horizontal Rule */}
        <div className="mb-6 sm:mb-8 flex items-center gap-4 sm:gap-6">
          <div className="h-px flex-1 bg-neutral-200"></div>
          <h2 className="text-center text-[12px] sm:text-[13px] font-bold tracking-[0.24em] text-neutral-900 uppercase">
            NEW AND POPULAR
          </h2>
          <div className="h-px flex-1 bg-neutral-200"></div>
        </div>

        {/* Filter Pills (Onfire Style) */}
        {filterTabs.length > 1 && (
          <div className="mb-8 sm:mb-10 flex flex-wrap justify-center gap-x-2 sm:gap-x-3 gap-y-2 text-[11px] sm:text-[12px] font-bold tracking-wider">
            {filterTabs.map((tab) => {
              const isActive = activeCategory === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveCategory(tab)}
                  className={`rounded-full px-4 py-1.5 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-neutral-900 text-white shadow-xs' 
                      : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}

        {/* Product Grid: 2 cols on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3.5 gap-y-7 sm:gap-x-5 sm:gap-y-10">
          {displayList.map((product, index) => (
            <ProductCard 
              key={product._id || product.id || index} 
              product={product} 
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10 sm:mt-14 text-center">
          <Link
            href="/shop"
            className="inline-block border border-neutral-900 px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all shadow-xs"
          >
            View All Apparel →
          </Link>
        </div>

      </div>
    </section>
  );
}
