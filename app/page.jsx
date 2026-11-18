import Link from 'next/link';
import Image from 'next/image';
import HeroBanner from './components/HeroBanner';
import Features from './components/Features';
import ProductCard from './components/ProductCard';
import NewAndPopularSection from './components/NewAndPopularSection';
import { getSupabaseAdmin } from '@/lib/supabase';
import { unstable_cache } from 'next/cache';

// JSON-LD structured data for Vestro Wear House
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vestro Wear House',
  url: 'https://www.vestrowearhouse.com',
  logo: 'https://www.vestrowearhouse.com/logo.png',
  description: 'Premium Fashion & Urban Streetwear Destination in Bangladesh.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'BD',
    addressLocality: 'Dhaka',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'support@vestrowearhouse.com',
    telephone: '+880 1345-447500',
    availableLanguage: ['English', 'Bengali'],
  },
};

export const revalidate = 300; // Cache homepage at the Edge for 5 minutes

const getCachedSupabaseData = unstable_cache(
  async () => {
    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      return { 
        categoriesRes: null, 
        featuredRes: null, 
        arrivalsRes: null, 
        allProductsRes: null,
        bannersRes: null, 
      };
    }

    const PRODUCT_CARD_FIELDS = 'id, name, sellingPrice, regularPrice, price, oldPrice, stockStatus, featuredImage, images, isFeatured, isNewArrival, isBestSeller, slug, rating, review_count, sold_count, category';

    const [categoriesRes, featuredRes, arrivalsRes, allProductsRes, bannersRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, image, icon, sort_order, isFeatured, status')
        .not('slug', 'in', '("system-category-layout","system-flash-sale-config","system-quick-channels")')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('products')
        .select(PRODUCT_CARD_FIELDS)
        .neq('isActive', false)
        .eq('isFeatured', true)
        .order('created_at', { ascending: false })
        .limit(16),
      supabase
        .from('products')
        .select(PRODUCT_CARD_FIELDS)
        .neq('isActive', false)
        .eq('isNewArrival', true)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('products')
        .select(PRODUCT_CARD_FIELDS)
        .neq('isActive', false)
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('banners')
        .select('id, title, subtitle, image, mobile_image, link, button_text, position, status')
        .eq('status', 'active')
        .order('position', { ascending: true })
        .limit(6),
    ]);

    return { categoriesRes, featuredRes, arrivalsRes, allProductsRes, bannersRes };
  },
  ['vestro-home-data-v3'],
  { revalidate: 60, tags: ['homepage-data'] }
);

async function getHomePageData() {
  try {
    const { 
      categoriesRes, 
      featuredRes, 
      arrivalsRes, 
      allProductsRes,
      bannersRes, 
    } = await getCachedSupabaseData();
    
    return {
      categories: categoriesRes?.data || [],
      featured: featuredRes?.data || [],
      arrivals: arrivalsRes?.data || [],
      allProducts: allProductsRes?.data || [],
      banners: bannersRes?.data || [],
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return { 
      categories: [], 
      featured: [], 
      arrivals: [], 
      allProducts: [], 
      banners: [],
    };
  }
}

// Fallback curated category tiles if database has empty/no categories yet
const defaultCategories = [
  {
    id: 'cat-1',
    name: 'T-Shirts & Polos',
    slug: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-2',
    name: 'Hoodies & Sweats',
    slug: 'hoodies',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-3',
    name: 'Bottoms & Pants',
    slug: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-4',
    name: 'Footwear & Shoes',
    slug: 'shoes',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
  },
];

export default async function HomePage() {
  const data = await getHomePageData();
  const rawCategories = data.categories || [];
  const displayCategories = rawCategories.length > 0 ? rawCategories : defaultCategories;

  const featuredProducts = data.featured || [];
  const newArrivals = data.arrivals || [];
  const allProducts = data.allProducts || [];
  const banners = data.banners || [];

  // Combined product list for tabs
  const combinedCatalog = allProducts.length > 0 
    ? allProducts 
    : [...featuredProducts, ...newArrivals];

  return (
    <div className="min-h-screen bg-white">
      {/* Hidden H1 for SEO */}
      <h1 className="sr-only">Vestro Wear House - Premium Fashion & Streetwear in Bangladesh</h1>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Split Hero Banner with Circular Categories & Trust Strip (Onfire Style) */}
      <HeroBanner banners={banners} categories={displayCategories} />

      {/* 2. Trust & Features Strip */}
      <Features />

      {/* 3. Featured Categories (Onfire 4:5 Portrait Grid) */}
      <section className="py-8 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Section Divider */}
          <div className="mb-6 sm:mb-10 flex items-center gap-4 sm:gap-6">
            <div className="h-px flex-1 bg-neutral-200"></div>
            <h2 className="text-center text-[12px] sm:text-[13px] font-bold tracking-[0.24em] text-neutral-900 uppercase">
              FEATURED CATEGORIES
            </h2>
            <div className="h-px flex-1 bg-neutral-200"></div>
          </div>

          {/* Category Cards: 2 cols on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {displayCategories.slice(0, 4).map((cat, idx) => {
              const catImage = cat.image || defaultCategories[idx % defaultCategories.length].image;
              return (
                <Link
                  key={cat.id || cat.slug || idx}
                  href={`/category/${cat.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden bg-neutral-100"
                >
                  <Image
                    src={catImage}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover h-full w-full transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 text-white">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] drop-shadow-xs">
                      {cat.name}
                    </p>
                    <span className="text-[10px] sm:text-[11px] text-neutral-300 tracking-wider group-hover:underline">
                      Shop Collection →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. New And Popular Interactive Catalog (Onfire Tabbed Grid) */}
      <NewAndPopularSection 
        products={combinedCatalog} 
        categories={displayCategories} 
      />

      {/* 5. High-Fashion Editorial Brand Statement Strip */}
      <section className="py-12 sm:py-20 bg-neutral-900 text-white my-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-3">
                THE VESTRO MANIFESTO
              </p>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight mb-4">
                STREET-READY SILHOUETTES · MODERN CRAFTSMANSHIP
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6 max-w-lg">
                Vestro Wear House redefines everyday apparel with precision cutting, heavy GSM cotton, 
                and drops designed for the modern lifestyle. Effortless style, supreme durability.
              </p>
              <Link
                href="/about"
                className="inline-block border border-white px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] hover:bg-white hover:text-black transition-all"
              >
                Read Our Story →
              </Link>
            </div>
            
            <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-neutral-800">
              <Image
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop"
                alt="Vestro Fashion Craftsmanship"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. New Arrivals Showcase */}
      {newArrivals.length > 0 && (
        <section className="py-8 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            
            <div className="mb-6 sm:mb-10 flex items-center gap-4 sm:gap-6">
              <div className="h-px flex-1 bg-neutral-200"></div>
              <h2 className="text-center text-[12px] sm:text-[13px] font-bold tracking-[0.24em] text-neutral-900 uppercase">
                NEW ARRIVALS
              </h2>
              <div className="h-px flex-1 bg-neutral-200"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3.5 gap-y-7 sm:gap-x-5 sm:gap-y-10">
              {newArrivals.slice(0, 8).map((product, idx) => (
                <ProductCard 
                  key={product._id || product.id || idx} 
                  product={product} 
                />
              ))}
            </div>

          </div>
        </section>
      )}

    </div>
  );
}
