import { Truck, ShieldCheck, RefreshCw, Banknote } from 'lucide-react';

export default function Features() {
  return (
    <section className="py-4 md:py-6 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* 1. Cash on Delivery */}
          <div className="flex items-center gap-2.5 md:gap-3.5 p-3 md:p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-emerald-100/80 hover:shadow-md transition-shadow">
            <div className="p-2.5 md:p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
              <Banknote className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-tight">ক্যাশ অন ডেলিভারি</h3>
              <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 truncate">পণ্য দেখে মূল্য পরিশোধ</p>
            </div>
          </div>

          {/* 2. Fast Delivery */}
          <div className="flex items-center gap-2.5 md:gap-3.5 p-3 md:p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-blue-100/80 hover:shadow-md transition-shadow">
            <div className="p-2.5 md:p-3 bg-blue-100 text-blue-700 rounded-xl shrink-0">
              <Truck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-tight">সারা দেশে ডেলিভারি</h3>
              <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 truncate">ঢাকা ২৪-৪৮ঘণ্টা • বাইরে ২-৪দিন</p>
            </div>
          </div>

          {/* 3. Easy Return */}
          <div className="flex items-center gap-2.5 md:gap-3.5 p-3 md:p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-purple-100/80 hover:shadow-md transition-shadow">
            <div className="p-2.5 md:p-3 bg-purple-100 text-purple-700 rounded-xl shrink-0">
              <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-tight">৭ দিনের রিপ্লেসমেন্ট</h3>
              <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 truncate">সমস্যা থাকলে সহজ রিটার্ন</p>
            </div>
          </div>

          {/* 4. Genuine Quality */}
          <div className="flex items-center gap-2.5 md:gap-3.5 p-3 md:p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-amber-100/80 hover:shadow-md transition-shadow">
            <div className="p-2.5 md:p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-tight">১০০% আসল প্রোডাক্ট</h3>
              <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 truncate">অরিজিনাল গেমিং ও টেক গিয়ার</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
