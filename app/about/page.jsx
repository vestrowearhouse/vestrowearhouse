import Link from 'next/link';
import { Truck, ShieldCheck, RefreshCw, Sparkles, Layers, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 py-14 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-2">
            PHILOSOPHY & CULTURE
          </p>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
            OUR STORY
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-3 max-w-lg mx-auto">
            Vestro Wear House is an urban streetwear house founded on contemporary silhouettes, premium heavy fabrics, and uncompromising detail.
          </p>
        </div>
      </div>

      {/* About Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 space-y-16">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-neutral-900 mb-4">
            Contemporary Streetwear for Modern Culture
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed mb-4">
            Born out of a passion for high-fashion aesthetics and everyday practicality, Vestro Wear House crafts timeless pieces designed to withstand trends. Every drop is manufactured with combed high-GSM cotton, precise stitch density, and relaxed drop-shoulder tailoring.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            We believe in honest pricing, rapid nationwide fulfillment, and hassle-free exchange so you can shop streetwear with total confidence across Bangladesh.
          </p>
        </div>

        {/* Brand Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 border border-neutral-200 bg-neutral-50/50">
            <Layers className="w-6 h-6 text-neutral-900 mb-3" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1">Heavyweight Fabrics</h3>
            <p className="text-xs text-neutral-500">Combed cotton with premium GSM for structured drop-shoulder drape.</p>
          </div>

          <div className="p-6 border border-neutral-200 bg-neutral-50/50">
            <Truck className="w-6 h-6 text-neutral-900 mb-3" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1">64 Districts COD</h3>
            <p className="text-xs text-neutral-500">Doorstep parcel delivery with cash on delivery across Bangladesh.</p>
          </div>

          <div className="p-6 border border-neutral-200 bg-neutral-50/50">
            <RefreshCw className="w-6 h-6 text-neutral-900 mb-3" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1">7-Day Exchange</h3>
            <p className="text-xs text-neutral-500">Hassle-free size and product replacement guarantee.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-black text-white p-8 sm:p-12 text-center">
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider mb-2">Explore The Latest Drop</h3>
          <p className="text-xs text-neutral-400 mb-6">Discover the new season streetwear collection.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
          >
            Shop Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
