'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProductCard from '../../components/ProductCard';
import { Filter, X } from 'lucide-react';

export default function CategoryPage({ params }) {
  const { slug } = params;
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [categoryIdToFetch, setCategoryIdToFetch] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const activeFiltersCount = (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);

  useEffect(() => {
    const fetchCategoryInfo = async () => {
      try {
        let rawCats = [];
        const cachedCats = sessionStorage.getItem('stellar_cats_cache');
        if (cachedCats) {
          try { rawCats = JSON.parse(cachedCats); } catch(e) {}
        }

        if (!rawCats || rawCats.length === 0) {
          const categoryRes = await fetch('/api/categories');
          const categoryData = await categoryRes.json();
          rawCats = categoryData.categories || [];
          if (rawCats.length > 0) {
            try { sessionStorage.setItem('stellar_cats_cache', JSON.stringify(rawCats)); } catch(e) {}
          }
        }

        // Helper to flatten nested tree if categories happened to be nested
        const flattenCategories = (list) => {
          let flat = [];
          for (const item of list) {
            flat.push(item);
            if (item.subcategories && Array.isArray(item.subcategories) && item.subcategories.length > 0) {
              flat = flat.concat(flattenCategories(item.subcategories));
            }
          }
          return flat;
        };

        const flatCats = flattenCategories(rawCats);
        const cleanSlug = decodeURIComponent(slug || '').trim().toLowerCase();

        const category = flatCats.find(c => 
          c.slug?.toLowerCase() === cleanSlug || 
          c.id?.toLowerCase() === cleanSlug || 
          c.name?.toLowerCase() === cleanSlug
        );
        
        if (category) {
          setCategoryName(category.name);
          setCategoryIdToFetch(category.id || category._id || category.slug);
        } else {
          // Format slug into title case as a fallback
          const formatted = cleanSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          setCategoryName(formatted || slug);
          setCategoryIdToFetch(slug);
        }
      } catch (err) {
        console.error('Error loading category:', err);
        setCategoryName(slug);
        setCategoryIdToFetch(slug);
      }
    };

    fetchCategoryInfo();
  }, [slug]);

  // Fetch products with filters
  const fetchProducts = async (pageNumber) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('category', categoryIdToFetch);
      params.append('page', pageNumber);
      params.append('limit', 20);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sort) params.append('sort', filters.sort);

      const productsRes = await fetch(`/api/products?${params.toString()}`);
      const data = await productsRes.json();
      
      const fetchedProducts = data.products || [];
      
      if (pageNumber === 1) {
        setProducts(fetchedProducts);
      } else {
        setProducts(prev => [...prev, ...fetchedProducts]);
      }
      
      setHasMore(data.hasMore !== undefined ? data.hasMore : fetchedProducts.length === 20);
    } catch (err) {
      console.error('Error loading products:', err);
      if (pageNumber === 1) setError('Failed to load products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    if (!categoryIdToFetch) return;
    
    // Reset to page 1 on filter/category changes
    setPage(1);
    // If filtering by price (user typing), debounce by 300ms; otherwise fetch immediately
    const delay = (filters.minPrice || filters.maxPrice) ? 300 : 0;
    const timer = setTimeout(() => fetchProducts(1), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryIdToFetch, filters.minPrice, filters.maxPrice, filters.sort]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  if (loading && initialLoad) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs uppercase tracking-widest text-neutral-400">Loading collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Category Hero Header (Onfire Minimal Aesthetic) */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 py-10 sm:py-14 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-2">
            COLLECTION
          </p>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">
            {categoryName}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs tracking-wider text-neutral-400 uppercase">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-black transition-colors">Categories</Link>
            <span>/</span>
            <span className="text-neutral-900 font-bold">{categoryName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {error && (
          <div className="bg-neutral-50 border border-neutral-200 p-4 mb-6 text-xs text-neutral-800 uppercase tracking-wider text-center">
            {error}
          </div>
        )}
        
        {/* Mobile Filter & Sort Toolbar */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex-1 flex items-center justify-center gap-2 bg-white px-3 py-2.5 border border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-900"
          >
            <Filter className="w-3.5 h-3.5" />
            {isMobileFilterOpen ? 'Hide Filters' : 'Filters'}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({...filters, sort: e.target.value})}
            className="flex-[2] bg-white px-3 py-2.5 border border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-900 focus:outline-none focus:border-black truncate"
          >
            <option value="newest">Sort: Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className={`md:col-span-1 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white border border-neutral-100 p-5 sticky top-28">
              <h3 className="hidden md:flex font-black text-xs uppercase tracking-[0.2em] text-neutral-900 mb-5 items-center gap-2">
                <Filter className="w-3.5 h-3.5" /> FILTERS
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block mb-2">Price (৳)</label>
                  <div className="flex gap-2">
                    <input
                      type="number" placeholder="Min" value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-neutral-200 text-xs font-semibold focus:border-black focus:outline-none"
                    />
                    <input
                      type="number" placeholder="Max" value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-neutral-200 text-xs font-semibold focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
                <div className="hidden md:block">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block mb-2">Sort</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({...filters, sort: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-200 text-xs font-semibold focus:border-black focus:outline-none"
                  >
                    <option value="newest">Newest Drop</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
                
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => setFilters({minPrice: '', maxPrice: '', sort: 'newest'})}
                    className="w-full mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="md:col-span-3 relative">
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
              {loading && !initialLoad && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
            </div>

            <div className={`transition-opacity duration-300 ${loading && !initialLoad ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-3.5 gap-y-7 sm:gap-x-5 sm:gap-y-10">
                    {products.map(product => (
                      <ProductCard key={product._id || product.id} product={product} />
                    ))}
                  </div>
                  
                  {hasMore && (
                    <div className="mt-14 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="border border-black bg-black hover:bg-neutral-800 text-white font-bold py-3 px-8 text-xs uppercase tracking-[0.2em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer"
                      >
                        {loadingMore ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="border border-neutral-100 p-14 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">No products found in this category.</p>
                  <p className="text-xs text-neutral-400">Try adjusting your filters or check our other collections.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
