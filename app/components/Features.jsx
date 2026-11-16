import { Truck, ShieldCheck, RefreshCw, Banknote } from 'lucide-react';

export default function Features() {
  return (
    <section className="py-6 sm:py-8 bg-neutral-50/70 border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          
          {/* 1. Cash on Delivery */}
          <div className="flex items-center gap-3 p-3.5 bg-white border border-neutral-100 shadow-xs">
            <div className="p-2.5 bg-neutral-100 text-neutral-900 rounded-none shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 text-xs sm:text-sm tracking-wide uppercase">Cash On Delivery</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5 truncate">Pay upon doorstep checking</p>
            </div>
          </div>

          {/* 2. Fast Nationwide Shipping */}
          <div className="flex items-center gap-3 p-3.5 bg-white border border-neutral-100 shadow-xs">
            <div className="p-2.5 bg-neutral-100 text-neutral-900 rounded-none shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 text-xs sm:text-sm tracking-wide uppercase">Nationwide Delivery</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5 truncate">Across all 64 districts in BD</p>
            </div>
          </div>

          {/* 3. Easy Exchange */}
          <div className="flex items-center gap-3 p-3.5 bg-white border border-neutral-100 shadow-xs">
            <div className="p-2.5 bg-neutral-100 text-neutral-900 rounded-none shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 text-xs sm:text-sm tracking-wide uppercase">7-Day Exchange</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5 truncate">Hassle-free size & return</p>
            </div>
          </div>

          {/* 4. Genuine Quality */}
          <div className="flex items-center gap-3 p-3.5 bg-white border border-neutral-100 shadow-xs">
            <div className="p-2.5 bg-neutral-100 text-neutral-900 rounded-none shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 text-xs sm:text-sm tracking-wide uppercase">Premium Quality</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5 truncate">100% Crafted Streetwear</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
