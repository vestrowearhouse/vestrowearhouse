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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#f8fafc]">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-600 mb-6 border border-red-100 shadow-sm">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          কিছু একটা সমস্যা হয়েছে
        </h1>
        <p className="text-sm md:text-base text-gray-500 mb-8 leading-relaxed">
          সার্ভার থেকে তথ্য লোড করতে সাময়িক বিঘ্ন ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#083b66] hover:bg-[#062c4d] text-white font-medium rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            আবার চেষ্টা করুন
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all shadow-sm"
          >
            <Home className="w-4 h-4" />
            হোম পেজ
          </Link>
        </div>
      </div>
    </div>
  );
}
