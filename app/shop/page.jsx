'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { Loader2, ArrowUpDown, ChevronDown } from 'lucide-react';

function ShopContent() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch categories for filter chips
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = `/api/products?page=${pageNum}&limit=16&sort=${sortBy}`;
      if (selectedCategory && selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      const newProducts = data.products || [];
      const total = data.pagination?.total || data.total || 0;

      setTotalCount(total);
      setHasMore(newProducts.length === 16);

      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  };

  const handleCategoryChange = (catName) => {
    setSelectedCategory(catName);
  };

  const sortOptions = [
    { value: 'latest', label: 'Latest Drop' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
  ];

  const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || 'Sort';

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-2">
            CATALOGUE
          </p>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">
            ALL COLLECTIONS
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-md mx-auto">
            Explore everyday streetwear, drop-shoulder silhouettes, and premium fabric essentials.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Controls Bar: Category Filter Pills + Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-neutral-100">
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {categories.map((c) => {
              const isSelected = selectedCategory === c.name || selectedCategory === c.slug;
              return (
                <button
                  key={c.id || c.slug}
                  onClick={() => handleCategoryChange(c.name)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="relative self-end sm:self-auto">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:border-black transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{currentSortLabel}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-neutral-100 shadow-xl z-20 py-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-neutral-50 ${
                      sortBy === opt.value ? 'font-bold text-black bg-neutral-50' : 'text-neutral-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Count Display */}
        <div className="py-4 text-xs tracking-wider text-neutral-400 uppercase font-semibold">
          Showing {products.length} {totalCount > 0 ? `of ${totalCount}` : ''} items
        </div>

        {/* Product Grid: 2 cols on mobile, 4 cols on desktop */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-neutral-400 mb-3" />
            <p className="text-xs uppercase tracking-widest text-neutral-400">Loading collection...</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3.5 gap-y-7 sm:gap-x-5 sm:gap-y-10">
              {products.map((product, idx) => (
                <ProductCard key={product.id || product._id || idx} product={product} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-14 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 border border-neutral-900 px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{loadingMore ? 'Loading...' : 'Load More Apparel'}</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <p className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-2">No items found</p>
            <p className="text-xs text-neutral-500 mb-6">Try selecting a different collection or filter.</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
