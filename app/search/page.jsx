'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { Search as SearchIcon, Filter, X, Sparkles, Loader2, Bot } from 'lucide-react';
import ProductCard from '../components/ProductCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'relevance'
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [categories, setCategories] = useState([]);
  
  // AI States
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  const activeFiltersCount = (filters.category ? 1 : 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);

  // Fetch categories for the filter sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // Allow filtering even if search query is empty but category is selected
    if (!query.trim() && !filters.category) {
      setResults([]);
      setInitialLoad(false);
      return;
    }

    const searchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If AI Mode is on and we have a query, get semantic intent first
        let appliedFilters = { ...filters };
        if (aiMode && query.trim() && !aiMessage && !aiLoading) {
           setAiLoading(true);
           try {
             const aiRes = await fetch('/api/ai/semantic-search', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ query })
             });
             const aiData = await aiRes.json();
             if (aiData.intent) {
               setAiMessage(aiData.intent.message);
               if (aiData.intent.filters.category) appliedFilters.category = aiData.intent.filters.category;
               if (aiData.intent.filters.maxPrice) appliedFilters.maxPrice = aiData.intent.filters.maxPrice;
               if (aiData.intent.filters.minPrice) appliedFilters.minPrice = aiData.intent.filters.minPrice;
               // Update state to match AI filters so UI reflects them
               setFilters(prev => ({
                 ...prev,
                 ...aiData.intent.filters
               }));
             }
           } catch (e) {
             console.error('AI Intent Error:', e);
           } finally {
             setAiLoading(false);
           }
        }
        
        const params = new URLSearchParams();
        params.append('search', query);
        if (appliedFilters.category) params.append('category', appliedFilters.category);
        if (appliedFilters.minPrice) params.append('minPrice', appliedFilters.minPrice);
        if (appliedFilters.maxPrice) params.append('maxPrice', appliedFilters.maxPrice);
        if (appliedFilters.sort) params.append('sort', appliedFilters.sort);
        
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search products');
        setResults([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    const timer = setTimeout(searchProducts, aiMode ? 500 : 300); // Debounce search
    return () => clearTimeout(timer);
  }, [query, filters, aiMode]);

  // Reset AI message when query changes
  useEffect(() => {
    if (aiMessage) setAiMessage('');
  }, [query]);

  if (loading && initialLoad) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">Searching catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-10 sm:py-14 border-b border-neutral-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase block mb-1">
                Vestro Wear House
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight mb-2 flex items-center gap-3">
                Search Results
                {aiMode && (
                  <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-300" /> AI
                  </span>
                )}
              </h1>
              <p className="text-neutral-400 text-xs sm:text-sm">
                {query ? `Showing results for "${query}"` : 'Enter keywords to browse products'}
              </p>
            </div>
            
            {/* AI Toggle Button */}
            <button
              onClick={() => {
                setAiMode(!aiMode);
                if (aiMode) {
                   setAiMessage('');
                   setFilters({category: '', minPrice: '', maxPrice: '', sort: 'relevance'});
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                aiMode 
                ? 'bg-white text-black border-white' 
                : 'bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${aiMode ? 'text-black' : 'text-neutral-400'}`} />
              {aiMode ? 'AI Search Active' : 'Enable AI Search'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Toolbar (Sort & Filter Toggle) */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex-1 flex items-center justify-center gap-2 bg-white px-3 py-2.5 rounded-lg border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-800"
          >
            <Filter className="w-3.5 h-3.5" />
            {isMobileFilterOpen ? 'Hide Filters' : 'Filters'}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({...filters, sort: e.target.value})}
            className="flex-[2] bg-white px-3 py-2.5 rounded-lg border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-800 focus:outline-none focus:border-black truncate"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`md:col-span-1 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h3 className="hidden md:flex font-bold uppercase tracking-wider text-xs text-neutral-900 mb-4 items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              
              <div className="space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1.5">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs uppercase tracking-wider focus:outline-none focus:border-black"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id || cat._id} value={cat.slug || cat.id || cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1.5">Price Range (৳)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-black"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Sort (Desktop) */}
                <div className="hidden md:block">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block mb-1.5">Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({...filters, sort: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs uppercase tracking-wider focus:outline-none focus:border-black"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => setFilters({category: '', minPrice: '', maxPrice: '', sort: 'relevance'})}
                    className="w-full mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 rounded-lg hover:bg-neutral-100 text-neutral-800 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="md:col-span-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-xs">{error}</p>
              </div>
            )}

            {/* AI Message Banner */}
            {aiMode && (aiMessage || aiLoading) && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-6 relative">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-xs text-neutral-900 mb-1">AI Assistant</h3>
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-neutral-600 text-xs font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing your intent to match pieces...
                      </div>
                    ) : (
                      <p className="text-neutral-700 text-xs sm:text-sm font-medium leading-relaxed">{aiMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {query ? (
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1">
                    {activeFiltersCount > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Active:</span>
                        {filters.category && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-full border border-neutral-300">
                            {categories.find(c => (c.slug || c.id || c._id) === filters.category)?.name || filters.category}
                            <button onClick={() => setFilters({...filters, category: ''})} className="hover:text-black"><X size={12}/></button>
                          </span>
                        )}
                        {filters.minPrice && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-full border border-neutral-300">
                            Min: ৳{filters.minPrice}
                            <button onClick={() => setFilters({...filters, minPrice: ''})} className="hover:text-black"><X size={12}/></button>
                          </span>
                        )}
                        {filters.maxPrice && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-full border border-neutral-300">
                            Max: ৳{filters.maxPrice}
                            <button onClick={() => setFilters({...filters, maxPrice: ''})} className="hover:text-black"><X size={12}/></button>
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-neutral-500 font-medium text-xs uppercase tracking-wider">
                      {results.length} {results.length === 1 ? 'product' : 'products'} found
                    </p>
                  </div>
                  {loading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  {results.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                    {results.map(product => (
                      <ProductCard key={product._id || product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-neutral-200 p-12 text-center">
                    <SearchIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-900 font-bold uppercase tracking-wider text-sm mb-1">No products found</p>
                    <p className="text-neutral-500 text-xs">Try searching with different fashion keywords</p>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200 p-12 text-center">
                <SearchIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-900 font-bold uppercase tracking-wider text-sm">Enter search keywords</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
