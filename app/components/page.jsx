import React from 'react';
import Link from 'next/link';

export default function FlashSalePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="text-center bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold text-red-600 mb-4">
          ⚡ Flash Sale!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Awesome deals are coming soon. Stay tuned for massive discounts on your favorite products!
        </p>
        <Link href="/shop" className="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}