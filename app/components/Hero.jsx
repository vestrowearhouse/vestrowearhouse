import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-black text-white py-16 sm:py-24 border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.28em] uppercase text-neutral-400 mb-3">
            CONTEMPORARY STREETWEAR
          </p>
          <h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tight text-white leading-tight mb-4">
            VESTRO WEAR HOUSE
          </h1>
          <p className="text-xs sm:text-base text-neutral-400 mb-8 max-w-xl leading-relaxed">
            Engineered silhouettes, combed heavyweight cotton, and minimal aesthetics. Designed for the streets of Dhaka and beyond.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/new" 
              className="px-8 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
            >
              Explore Drops
            </Link>
            <Link 
              href="/shop" 
              className="px-8 py-3.5 border border-white text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors"
            >
              All Collections
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
