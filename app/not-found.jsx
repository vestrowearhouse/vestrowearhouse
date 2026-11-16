'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, ShoppingBag, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    // Only log legitimate human 404s, skip obvious bot scanner probes
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isBotProbe = /(\.php|\.env|\.git|wp-|pma|eval|actuator|xmlrpc)/i.test(pathname);

    if (!isBotProbe && pathname) {
      fetch('/api/admin/page-logs/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_path: pathname,
          error_code: 404
        })
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-20 bg-white">
      <div className="max-w-md w-full text-center">
        <span className="text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase block mb-3">
          Vestro Wear House
        </span>
        <div className="font-mono text-7xl font-extrabold text-neutral-900 tracking-tighter mb-4">
          404
        </div>
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-neutral-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-xs md:text-sm text-neutral-500 mb-8 max-w-sm mx-auto">
          The page you are looking for doesn't exist or has been relocated in our archive.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Explore Collection
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-900 font-bold text-xs uppercase tracking-widest rounded-lg border border-neutral-300 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
