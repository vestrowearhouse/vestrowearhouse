'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the 500 error safely
    try {
      fetch('/api/admin/page-logs/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_path: typeof window !== 'undefined' ? window.location.pathname : '',
          error_code: 500,
          details: error?.message || 'Unknown error'
        })
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-20 bg-white">
      <div className="max-w-md w-full text-center">
        <span className="text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase block mb-3">
          Vestro Wear House
        </span>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-800 mb-6 border border-neutral-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-neutral-900 mb-2">
          Something Went Wrong
        </h1>
        <p className="text-xs md:text-sm text-neutral-500 mb-8 max-w-sm mx-auto">
          We encountered a temporary issue while loading this page. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
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
