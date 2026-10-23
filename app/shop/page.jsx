'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import { 
  Loader2, 
  ArrowUpDown, 
  ChevronDown, 
  Store, 
  ShieldCheck, 
  Star, 
  BadgeCheck, 
  MapPin, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

function ShopContent() {
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get('vendor') || null;

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

  // Vendor Details state if filtered by vendor
  const [vendorInfo, setVendorInfo] = useState(null);
  const [vendorLoading, setVendorLoading] = useState(false);

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

  // Fetch vendor info if vendorParam is present
  useEffect(() => {
    if (!vendorParam) {
      setVendorInfo(null);
      return;
    }

    if (vendorParam === 'official') {
      setVendorInfo({
        is_official: true,
        shop_name: 'Stellar Mart Official Store',
        description: 'Directly sourced, 100% authentic products fulfilled with express delivery from StellarMart fulfillment center.',
        rating: 4.9,
        total_reviews: 1250,
        badge: 'Official Flagship Mall'
      });
      return;
    }

    async function loadVendor() {
      setVendorLoading(true);
      try {
        const res = await fetch(`/api/vendors/${vendorParam}`);
        if (res.ok) {
          const data = await res.json();
          setVendorInfo(data.vendor);
        }
      } catch (err) {
        console.error('Failed to load vendor details:', err);
      } finally {
        setVendorLoading(false);
      }
    }

    loadVendor();
  }, [vendorParam]);

  // Fetch products based on category, sort, page, and vendor
  const fetchProducts = useCallback(async (pageNumber = 1, category = selectedCategory, sort = sortBy) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);

      let url = `/api/products?page=${pageNumber}&limit=20`;
      if (category && category !== 'all') {
        url += `&category=${encodeURIComponent(category)}`;
      }
      if (sort && sort !== 'latest') {
        url += `&sort=${encodeURIComponent(sort)}`;
      }
      if (vendorParam) {
        url += `&vendor=${encodeURIComponent(vendorParam)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const fetchedProducts = data.products || [];

      if (pageNumber === 1) {
        setProducts(fetchedProducts);
      } else {
        setProducts(prev => [...prev, ...fetchedProducts]);
      }

      if (data.totalCount !== undefined) {
        setTotalCount(data.totalCount);
      } else if (pageNumber === 1) {
        setTotalCount(fetchedProducts.length);
      }

      setHasMore(data.hasMore !== undefined ? data.hasMore : fetchedProducts.length === 20);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, sortBy, vendorParam]);

  // Refetch when category, sort, or vendor changes
  useEffect(() => {
    setPage(1);
    fetchProducts(1, selectedCategory, sortBy);
  }, [selectedCategory, sortBy, vendorParam, fetchProducts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, selectedCategory, sortBy);
    }
  };

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
  };

  const sortOptions = [
    { value: 'latest', label: 'Latest Arrivals' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
  ];

  const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || 'Sort By';

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sleek Minimalist Top Navigation & Header */}
      <div className="bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-5 pb-3">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 font-medium mb-2">
            <Link href="/" className="hover:text-[#083b66] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#083b66] transition-colors">Shop</Link>
            {vendorParam && (
              <>
                <span>/</span>
                <span className="text-gray-800 font-semibold truncate max-w-[200px]">
                  {vendorParam === 'official' ? 'Stellar Mart Official' : (vendorInfo?.shop_name || 'Vendor Store')}
                </span>
              </>
            )}
          </div>

          {/* Store Banner (If filtered by store / vendor) */}
          {vendorParam && (
            <div className={`mb-4 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden shadow-sm ${
              vendorParam === 'official'
                ? 'bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-blue-800/60'
                : 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/60'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md border ${
                    vendorParam === 'official'
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 border-white/20'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-500 border-white/20'
                  }`}>
                    {vendorParam === 'official' ? (
                      <ShieldCheck className="w-8 h-8 text-white" />
                    ) : vendorInfo?.logo_url ? (
                      <img src={vendorInfo.logo_url} alt={vendorInfo.shop_name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Store className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full shadow-xs ${
                        vendorParam === 'official'
                          ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950'
                          : 'bg-purple-200 text-purple-950'
                      }`}>
                        {vendorParam === 'official' ? '👑 Official Mall' : '🏬 Verified Vendor Store'}
                      </span>
                      <span className="text-xs text-blue-200 flex items-center gap-1 font-medium">
                        <BadgeCheck className="w-3.5 h-3.5 inline text-emerald-400" /> 100% Genuine Products
                      </span>
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black text-white mt-1">
                      {vendorParam === 'official' ? 'Stellar Mart Official Store' : (vendorInfo?.shop_name || 'Vendor Store')}
                    </h1>
                    {vendorInfo?.shop_address && (
                      <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {vendorInfo.shop_address}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15 whitespace-nowrap self-end sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> View All Stores
                </Link>
              </div>
            </div>
          )}

          {/* Top Row: Title & Sort */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                  {vendorParam ? 'Store Catalog' : 'All Products'}
                </h2>
                {!loading && (
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500">
                    ({totalCount > 0 ? `${totalCount} items` : `${products.length} items`})
                  </span>
                )}
              </div>
            </div>

            {/* Modern Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 transition-colors shadow-2xs"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                <span className="truncate max-w-[110px] sm:max-w-none">{currentSortLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setSortOpen(false)} 
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortBy(option.value);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                          sortBy === option.value 
                            ? 'bg-blue-50 text-[#083b66] font-bold' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#083b66] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.name || selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id || cat._id || cat.slug}
                  onClick={() => handleCategorySelect(cat.slug || cat.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#083b66] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Products Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#083b66] mb-3" />
            <p className="text-gray-500 font-medium text-sm">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-2xs max-w-lg mx-auto p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500 text-xs sm:text-sm mb-5">
              There are no products available for the selected filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSortBy('latest');
              }}
              className="bg-[#083b66] text-white text-xs sm:text-sm font-bold py-2.5 px-6 rounded-full hover:bg-[#062c4d] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {products.map(product => (
                <ProductCard 
                  key={product.id || product._id || product.slug} 
                  product={product} 
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 sm:mt-12 text-center pb-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-white hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-8 sm:px-10 rounded-full border border-gray-300 shadow-xs hover:shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#083b66]" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <span>Load More Products</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#083b66]" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
