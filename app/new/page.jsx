'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { Loader2 } from 'lucide-react';

export default function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await fetch('/api/products?isNewArrival=true&limit=24&sort=latest');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Failed to load new arrivals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 py-10 sm:py-14 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-2">
            FRESH DROP
          </p>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">
            NEW ARRIVALS
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-md mx-auto">
            The newest streetwear drops, essential layers, and modern fits just landed.
          </p>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-neutral-400 mb-3" />
            <p className="text-xs uppercase tracking-widest text-neutral-400">Loading new arrivals...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3.5 gap-y-7 sm:gap-x-5 sm:gap-y-10">
            {products.map((product, idx) => (
              <ProductCard key={product.id || product._id || idx} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-2">New drop coming soon</p>
            <p className="text-xs text-neutral-500 mb-6">Check back shortly or explore our current catalog.</p>
            <Link
              href="/shop"
              className="inline-block px-7 py-3 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider"
            >
              Shop All Apparel →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
