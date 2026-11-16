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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/" className="text-blue-600 hover:underline">Home</Link>
          <span className="text-gray-400">/</span>
          <Link href="/categories" className="text-blue-600 hover:underline">Categories</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700">{categoryName}</span>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {/* Mobile Toolbar */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex-1 flex items-center justify-center gap-2 bg-white px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 shadow-sm"
          >
            <Filter className="w-4 h-4" />
            {isMobileFilterOpen ? 'Hide Filters' : 'Filters'}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({...filters, sort: e.target.value})}
            className="flex-[2] bg-white px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none truncate"
          >
            <option value="newest">Sort: Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className={`md:col-span-1 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-5 md:p-6 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h3 className="hidden md:flex font-bold text-gray-900 mb-4 items-center gap-2">
                <Filter className="w-5 h-5" /> Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number" placeholder="Min" value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number" placeholder="Max" value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="hidden md:block">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({...filters, sort: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
                
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => setFilters({minPrice: '', maxPrice: '', sort: 'newest'})}
                    className="w-full mt-4 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="md:col-span-3 relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 font-medium">Active Filters:</span>
                    {filters.minPrice && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                        Min: ৳{filters.minPrice}
                        <button onClick={() => setFilters({...filters, minPrice: ''})} className="hover:text-blue-900"><X size={12}/></button>
                      </span>
                    )}
                    {filters.maxPrice && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                        Max: ৳{filters.maxPrice}
                        <button onClick={() => setFilters({...filters, maxPrice: ''})} className="hover:text-blue-900"><X size={12}/></button>
                      </span>
                    )}
                  </div>
                )}
                <p className="text-gray-600 font-medium">
                  {products.length} product{products.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {loading && !initialLoad && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
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
                    <div className="mt-12 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="border border-neutral-900 bg-neutral-900 hover:bg-black text-white font-bold py-3 px-8 text-xs uppercase tracking-[0.2em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                      >
                        {loadingMore ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          'Load More Apparel'
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <p className="text-gray-600">No products found with the applied filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
