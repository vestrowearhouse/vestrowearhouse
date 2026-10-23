'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Grid, Sparkles, ChevronRight, X } from 'lucide-react';

export default function CategoriesClient({ initialCategories = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('all');

  // Identify top-level parent categories for department filtering
  const parentCategories = useMemo(() => {
    return initialCategories.filter((cat) => !cat.parent_id);
  }, [initialCategories]);

  // Filter categories based on search and selected department
  const filteredCategories = useMemo(() => {
    return initialCategories.filter((cat) => {
      // Exclude system categories
      if (cat.slug?.startsWith('system-')) return false;

      // Match search query
      const matchesSearch = !searchQuery.trim() || 
        cat.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        cat.slug?.toLowerCase().includes(searchQuery.toLowerCase().trim());

      if (!matchesSearch) return false;

      // Match department filter
      if (selectedParentId === 'all') return true;
      return cat.parent_id === selectedParentId || cat.id === selectedParentId;
    });
  }, [initialCategories, searchQuery, selectedParentId]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16">
      {/* 1. Sleek Brand Header (Replaces the old green banner) */}
      <div className="bg-gradient-to-r from-[#083b66] via-[#0b487c] to-[#083b66] text-white pt-6 pb-8 px-4 shadow-md relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-orange-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-blue-200 mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white font-medium">Categories</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">All Categories</h1>
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {initialCategories.length} Departments
                </span>
              </div>
              <p className="text-xs md:text-sm text-blue-100/90 mt-1 max-w-xl">
                Explore our curated catalog of authentic products across fashion, electronics, lifestyle and more.
              </p>
            </div>

            {/* In-page Category Search Input */}
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category name..."
                className="w-full pl-9 pr-9 py-2.5 bg-white/95 text-gray-900 placeholder-gray-400 text-xs md:text-sm rounded-full border border-transparent focus:border-orange-400 focus:bg-white focus:outline-none shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Department Filter Tabs (Horizontal Scroll) */}
      <div className="bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 md:px-4">
          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar items-center">
            <button
              onClick={() => setSelectedParentId('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${
                selectedParentId === 'all'
                  ? 'bg-[#083b66] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200/70 border border-gray-200/50'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              All Categories
            </button>
            {parentCategories.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedParentId(p.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${
                  selectedParentId === p.id
                    ? 'bg-[#083b66] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200/70 border border-gray-200/50'
                }`}
              >
                <span>{p.icon || '📦'}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Category Grid */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-5">
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 md:gap-4">
            {filteredCategories.map((category) => {
              const hasImage = category.icon_type === 'image' && category.image;
              const hasCustom = category.icon_type === 'custom' && category.custom_code;
              const imageSrc = category.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';

              return (
                <Link
                  key={category.id || category.slug}
                  href={`/category/${category.slug}`}
                  className="group bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col items-center justify-between text-center relative overflow-hidden active:scale-95"
                >
                  {/* Subtle Top Badge for Featured */}
                  {category.isFeatured && (
                    <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                      HOT
                    </div>
                  )}

                  {/* Icon / Image Container */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50/50 border border-gray-100 flex items-center justify-center mb-2 group-hover:scale-105 group-hover:shadow-sm transition-transform duration-300 overflow-hidden relative">
                    {hasImage ? (
                      <Image
                        src={imageSrc}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 64px, 80px"
                      />
                    ) : hasCustom ? (
                      <div
                        className="w-full h-full flex items-center justify-center p-2"
                        dangerouslySetInnerHTML={{ __html: category.custom_code }}
                      />
                    ) : (
                      <span className="text-3xl md:text-4xl select-none">
                        {category.icon || '📦'}
                      </span>
                    )}
                  </div>

                  {/* Category Title */}
                  <div className="w-full">
                    <h3 className="font-bold text-gray-800 text-[11px] md:text-xs leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>

                  {/* Subtle arrow indicator on desktop */}
                  <div className="hidden md:flex items-center text-[10px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5">
                    <span>Shop now</span>
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm my-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">No categories found</h3>
            <p className="text-xs text-gray-500 mb-4">
              {searchQuery ? `No results matching "${searchQuery}"` : 'No categories available in this department.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedParentId('all');
              }}
              className="px-4 py-2 bg-[#083b66] text-white text-xs font-semibold rounded-full hover:bg-blue-800 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
