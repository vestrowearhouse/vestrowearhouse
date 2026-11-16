'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronRight, X, ArrowUpRight } from 'lucide-react';

export default function CategoriesClient({ initialCategories = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('all');

  const parentCategories = useMemo(() => {
    return initialCategories.filter((cat) => !cat.parent_id);
  }, [initialCategories]);

  const filteredCategories = useMemo(() => {
    return initialCategories.filter((cat) => {
      if (cat.slug?.startsWith('system-')) return false;

      const matchesSearch = !searchQuery.trim() || 
        cat.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        cat.slug?.toLowerCase().includes(searchQuery.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (selectedParentId === 'all') return true;
      return cat.parent_id === selectedParentId || cat.id === selectedParentId;
    });
  }, [initialCategories, searchQuery, selectedParentId]);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 1. Sleek Minimal Header */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-2">
            CATALOGUE
          </p>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">
            ALL CATEGORIES
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-md mx-auto">
            Discover tailored silhouettes, oversized fits, and contemporary streetwear essentials.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH CATEGORY..."
              className="w-full pl-11 pr-10 py-3 bg-white text-neutral-900 placeholder-neutral-400 text-xs font-semibold uppercase tracking-wider border border-neutral-200 focus:border-black focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filter Pills */}
      {parentCategories.length > 0 && (
        <div className="border-b border-neutral-100 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedParentId('all')}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                selectedParentId === 'all'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {parentCategories.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedParentId(p.id)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  selectedParentId === p.id
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. High-Fashion Category Grid (Onfire Lookbook style) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredCategories.map((category) => {
              const imageSrc = category.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80';

              return (
                <Link
                  key={category.id || category.slug}
                  href={`/category/${category.slug}`}
                  className="group relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 block"
                >
                  {/* Category Background Image */}
                  <Image
                    src={imageSrc}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {/* Dark Elegant Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity group-hover:opacity-90"></div>

                  {/* Category Details at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white flex flex-col justify-end">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-300 mb-1">
                      Collection
                    </span>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                        {category.name}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-white transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <Search className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-800 uppercase tracking-wider mb-1">No Categories Found</h3>
            <p className="text-xs text-neutral-500 mb-6">
              {searchQuery ? `No category matching "${searchQuery}"` : 'No categories available.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedParentId('all');
              }}
              className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
