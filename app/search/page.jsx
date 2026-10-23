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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 relative overflow-hidden">
        {/* Subtle decorative background for AI Mode */}
        {aiMode && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-10 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-40 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                Search Results
                {aiMode && <span className="px-2 py-1 bg-white/20 rounded-lg text-sm font-bold flex items-center gap-1 backdrop-blur-sm"><Sparkles className="w-4 h-4 text-purple-300" /> AI Active</span>}
              </h1>
              <p className="text-blue-100">
                {query ? `Showing results for "${query}"` : 'Enter a search term to find products'}
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
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 border shadow-lg ${
                aiMode 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-transparent hover:shadow-purple-500/30' 
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${aiMode ? 'text-purple-200 animate-pulse' : ''}`} />
              {aiMode ? 'AI Search Assistant ON' : 'Enable AI Assistant'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Toolbar (Sort & Filter Toggle) */}
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
            <option value="relevance">Sort: Relevance</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`md:col-span-1 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-5 md:p-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h3 className="hidden md:flex font-bold text-gray-900 mb-4 items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h3>
              
              <div className="space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id || cat._id} value={cat.slug || cat.id || cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Sort (Hidden on mobile since it's in the top bar) */}
                <div className="hidden md:block">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({...filters, sort: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
                    className="w-full mt-4 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
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
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* AI Message Banner */}
            {aiMode && (aiMessage || aiLoading) && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 mb-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <Bot className="w-24 h-24 text-purple-600" />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">AI Assistant</h3>
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-purple-600 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing your intent to find the perfect matches...
                      </div>
                    ) : (
                      <p className="text-gray-700 leading-relaxed font-medium">{aiMessage}</p>
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
                        <span className="text-xs text-gray-500 font-medium">Active Filters:</span>
                        {filters.category && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                            Category: {categories.find(c => (c.slug || c.id || c._id) === filters.category)?.name || filters.category}
                            <button onClick={() => setFilters({...filters, category: ''})} className="hover:text-blue-900"><X size={12}/></button>
                          </span>
                        )}
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
                      {results.length} product{results.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  {loading && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  {results.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                    {results.map(product => (
                      <ProductCard key={product._id || product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No products found</p>
                    <p className="text-gray-500">Try searching with different keywords</p>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No search query entered</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
