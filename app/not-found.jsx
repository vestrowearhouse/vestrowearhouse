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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#f8fafc]">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 text-blue-600 mb-6 font-black text-4xl shadow-sm border border-blue-100">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          পৃষ্ঠাটি পাওয়া যায়নি
        </h1>
        <p className="text-sm md:text-base text-gray-500 mb-8 leading-relaxed">
          দুঃখিত! আপনি যে লিঙ্কটিতে প্রবেশ করার চেষ্টা করছেন তা সরানো হয়েছে অথবা লিংকটি ভুল।
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#083b66] hover:bg-[#062c4d] text-white font-medium rounded-xl transition-all shadow-sm hover:shadow"
          >
            <Home className="w-4 h-4" />
            হোম পেজে ফিরুন
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            কেনাকাটা চালিয়ে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
