import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { ArrowRight as ArrowRightIcon } from 'lucide-react';
import HeroBanner from './components/HeroBanner';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';
import ProductCard from './components/ProductCard';

// MobileHomeView is a large client-only component (23KB) — never shown on desktop
// Lazy-load it so it doesn't block the initial page render
const MobileHomeView = dynamic(() => import('./components/MobileHomeView'), {
  ssr: false,
  loading: () => null,
});


// JSON-LD structured data for the Organization — helps Google rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'StellarMartBD',
  url: 'https://www.stellarmartbd.com',
  logo: 'https://i.postimg.cc/CxQSCP22/Whats-App-Image-2026-04-29-at-9-49-48-PM.jpg',
  description: 'Best e-commerce platform in Bangladesh.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'BD',
    addressLocality: 'Dhaka',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'support@stellarmartbd.com',
    telephone: '+880 1606-069754',
    availableLanguage: ['English', 'Bengali'],
  },
  sameAs: [
    'https://www.facebook.com/stellarmartbd',
  ],
};

export const revalidate = 300; // Cache homepage at the Edge for 5 minutes to drastically cut Supabase Egress

import { unstable_cache } from 'next/cache';

const getCachedSupabaseData = unstable_cache(
  async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { 
        categoriesRes: null, 
        featuredRes: null, 
        arrivalsRes: null, 
        allProductsRes: null,
        bannersRes: null, 
        layoutRes: null, 
        flashSaleRes: null,
        quickChannelsRes: null,
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    // OPTIMIZATION: Only fetch lightweight fields needed for product cards.
    // Heavy columns (HTML description, attributes, variants, full image arrays) are omitted to reduce egress by >95%.
    const PRODUCT_CARD_FIELDS = 'id, name, nameBn, sellingPrice, regularPrice, price, oldPrice, stockStatus, featuredImage, isFeatured, isNewArrival, isBestSeller, slug, rating, review_count, sold_count, vendor_id';

    const [categoriesRes, featuredRes, arrivalsRes, allProductsRes, bannersRes, layoutRes, flashSaleRes, quickChannelsRes] = await Promise.all([
      supabase.from('categories').select('id, name, slug, image, icon, icon_type, custom_code, sort_order, isFeatured, status').not('slug', 'in', '("system-category-layout","system-flash-sale-config","system-quick-channels")').eq('status', 'active').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('products').select(PRODUCT_CARD_FIELDS).neq('isActive', false).or('isFeatured.eq.true,featured.eq.true').order('created_at', { ascending: false }).limit(16),
      supabase.from('products').select(PRODUCT_CARD_FIELDS).neq('isActive', false).eq('isNewArrival', true).order('created_at', { ascending: false }).limit(12),
      supabase.from('products').select(PRODUCT_CARD_FIELDS).neq('isActive', false).order('created_at', { ascending: false }).limit(20),
      supabase.from('banners').select('id, title, image, mobile_image, link, position, status').eq('status', 'active').order('position', { ascending: true }).limit(10),
      supabase.from('categories').select('custom_code').eq('slug', 'system-category-layout').single(),
      supabase.from('categories').select('custom_code, status').eq('slug', 'system-flash-sale-config').single(),
      supabase.from('categories').select('custom_code, status').eq('slug', 'system-quick-channels').single()
    ]);

    return { categoriesRes, featuredRes, arrivalsRes, allProductsRes, bannersRes, layoutRes, flashSaleRes, quickChannelsRes };
  },
  ['homepage-data-v3'],
  { revalidate: 300, tags: ['homepage-data'] }
);

async function getHomePageData() {
  try {
    const { 
      categoriesRes, 
      featuredRes, 
      arrivalsRes, 
      allProductsRes,
      bannersRes, 
      layoutRes, 
      flashSaleRes,
      quickChannelsRes, 
    } = await getCachedSupabaseData();
    
    if (!categoriesRes) {
      return { 
        categories: [], 
        featured: [], 
        arrivals: [], 
        allProducts: [], 
        banners: [], 
        categoryLayout: null, 
        flashSaleConfig: null,
        quickChannelsConfig: null
      };
    }

    const featuredProducts = (featuredRes?.data || []);
    const newArrivals = (arrivalsRes?.data || []);
    const allProducts = (allProductsRes?.data || []);

    let categoryLayout = null;
    if (layoutRes?.data && layoutRes.data.custom_code) {
      try {
        categoryLayout = JSON.parse(layoutRes.data.custom_code);
      } catch(e) {}
    }

    let flashSaleConfig = null;
    if (flashSaleRes?.data && flashSaleRes.data.custom_code) {
      try {
        const parsed = JSON.parse(flashSaleRes.data.custom_code);
        flashSaleConfig = {
          ...parsed,
          enabled: flashSaleRes.data.status !== 'inactive' && parsed.enabled !== false
        };
      } catch(e) {}
    }

    let quickChannelsConfig = null;
    if (quickChannelsRes?.data && quickChannelsRes.data.custom_code) {
      try {
        const parsed = JSON.parse(quickChannelsRes.data.custom_code);
        quickChannelsConfig = {
          ...parsed,
          enabled: quickChannelsRes.data.status !== 'inactive' && parsed.enabled !== false
        };
      } catch(e) {}
    }

    return {
      categories: categoriesRes?.data || [],
      featured: featuredProducts,
      arrivals: newArrivals,
      allProducts: allProducts,
      banners: bannersRes?.data || [],
      categoryLayout,
      flashSaleConfig,
      quickChannelsConfig
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return { 
      categories: [], 
      featured: [], 
      arrivals: [], 
      allProducts: [], 
      banners: [],
      categoryLayout: null,
      flashSaleConfig: null,
      quickChannelsConfig: null
    };
  }
}

export default async function HomePage() {
  const data = await getHomePageData();
  const categories = data.categories || [];
  const featuredProducts = data.featured || [];
  const newArrivals = data.arrivals || [];
  const allProducts = data.allProducts || [];
  let banners = data.banners || [];

  const defaultBanners = [
    {
      id: 'default-1',
      title: 'Mega Sale',
      description: 'Up to 50% Off on Electronics',
      image: '/banners/default_banner_1.webp',
      link: '/flash-sale',
      position: 0,
    },
    {
      id: 'default-2',
      title: 'New Collection',
      description: 'Explore Latest Fashion Trends',
      image: '/banners/default_banner_2.webp',
      link: '/category/fashion',
      position: 1,
    },
    {
      id: 'default-3',
      title: 'Free Shipping',
      description: 'On Orders Over ৳500',
      image: '/banners/default_banner_3.webp',
      link: '/shop',
      position: 2,
    },
    {
      id: 'default-side-1',
      title: 'Special Deals',
      description: 'Top Electronics & Accessories',
      image: '/banners/default_banner_4.webp',
      link: '/category/electronics',
      position: 100,
    },
    {
      id: 'default-side-2',
      title: 'Fashion Trends',
      description: 'Up to 40% Off New Styles',
      image: '/banners/default_banner_5.webp',
      link: '/category/fashion',
      position: 200,
    },
  ];

  if (banners.length === 0) {
    banners = defaultBanners;
  }

  // The API already prioritizes isFeatured categories at the top,
  // so we just display all 12 fetched categories.
  const displayCategories = categories;
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : [];
  const displayNewArrivals = newArrivals.length > 0 ? newArrivals : [];

  const categoryLayoutPc = data.categoryLayout?.pc || [];
  const categoryLayoutMobile = data.categoryLayout?.mobile || [];
  const useLayout = categoryLayoutPc.length > 0 || categoryLayoutMobile.length > 0;

  const getCategoryById = (id) => categories.find(c => c.id === id);

  const renderCategoryCard = (categoryOrId, isMobileOnly = false, isDesktopOnly = false, indexKey = 0) => {
    const id = typeof categoryOrId === 'object' && categoryOrId !== null && categoryOrId.id !== undefined ? categoryOrId.id : categoryOrId;
    const category = getCategoryById(id);
    
    if (!category) return <div key={`empty-${indexKey}`} className={`bg-gray-50/50 border border-gray-100 border-dashed rounded-xl md:rounded-2xl min-h-[120px] ${isDesktopOnly ? 'hidden md:flex' : ''} ${isMobileOnly ? 'flex md:hidden' : ''}`}></div>;

    // Check for layout overrides
    const hasOverride = typeof categoryOrId === 'object' && categoryOrId !== null && categoryOrId.hasOverride;
    const iconType = hasOverride ? categoryOrId.iconType : category.icon_type;
    const image = hasOverride ? categoryOrId.image : category.image;
    const customCode = hasOverride ? categoryOrId.customCode : category.custom_code;
    const icon = hasOverride ? categoryOrId.icon : category.icon;

    return (
      <Link
        key={category.id || category.slug}
        href={`/category/${category.slug}`}
        className={`group bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 flex-col items-center justify-center hover:border-blue-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex ${isDesktopOnly ? 'hidden md:flex' : ''} ${isMobileOnly ? 'flex md:hidden' : ''}`}
      >
        <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-50 rounded-full flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-transform duration-300 overflow-hidden shadow-inner">
          {iconType === 'image' && image ? (
            <Image 
              src={image} 
              alt={category.name} 
              width={80} 
              height={80} 
              loading="lazy"
              className="w-full h-full object-cover" 
            />
          ) : iconType === 'custom' && customCode ? (
            <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: customCode }} />
          ) : (
            <span className="text-2xl md:text-3xl">{icon || '📦'}</span>
          )}
        </div>
        <h3 className="font-bold text-gray-800 group-hover:text-blue-600 text-xs md:text-sm text-center w-full truncate">{category.name}</h3>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hidden H1 for SEO & Screen Readers (ensures proper descending heading hierarchy) */}
      <h1 className="sr-only">Stellar Mart BD - Best Online Shopping Platform in Bangladesh</h1>

      {/* JSON-LD structured data for SEO — invisible to users, read by search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Mobile-Only App Home View */}
      <div className="md:hidden">
        <MobileHomeView
          categories={categories}
          featuredProducts={featuredProducts}
          newArrivals={newArrivals}
          allProducts={allProducts}
          banners={banners}
          flashSaleConfig={data.flashSaleConfig}
          quickChannelsConfig={data.quickChannelsConfig}
        />
      </div>

      {/* Desktop/PC View (Preserved Exactly) */}
      <div className="hidden md:block">
        <HeroBanner banners={banners} />

      <section className="py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/categories" aria-label="View all shopping categories" className="text-blue-700 hover:underline flex items-center gap-1 font-semibold text-sm md:text-base">
              View All <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          
          {useLayout ? (
            <>
              {/* PC Grid (12 items) */}
              <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-4">
                {categoryLayoutPc.slice(0, 12).map((item, index) => renderCategoryCard(item, false, true, index))}
              </div>
              {/* Mobile Grid (6 items) */}
              <div className="grid md:hidden grid-cols-3 gap-2">
                {categoryLayoutMobile.slice(0, 6).map((item, index) => renderCategoryCard(item, true, false, index))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
              {categories.length > 0 ? (
                categories.slice(0, 12).map((category, index) => {
                  const isDesktopOnly = index >= 6;
                  return renderCategoryCard(category, false, isDesktopOnly, index);
                })
              ) : (
                <div className="col-span-full text-center text-gray-500">No categories found.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {displayFeatured.length > 0 && (
      <section className="py-6 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Featured Products</h2>
              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-red-700 text-white text-[10px] md:text-xs font-bold rounded-full">HOT</span>
            </div>
            <Link href="/shop" aria-label="View all featured products" className="text-blue-700 hover:underline flex items-center gap-1 font-semibold text-sm md:text-base">
              View All <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
            {displayFeatured.map((product, index) => (
              <ProductCard key={product._id || product.id || index} product={product} />
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl md:rounded-2xl p-4 md:p-8 text-white">
              <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">Super Sale</h2>
              <p className="mb-3 md:mb-4 opacity-95 text-sm md:text-base">Up to 50% off on electronics</p>
              <Link href="/shop" aria-label="Shop Super Sale electronics" className="inline-block px-4 md:px-6 py-2 md:py-2.5 bg-white text-pink-600 rounded-lg font-bold hover:bg-gray-100 text-sm md:text-base">
                Shop Now
              </Link>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-8 text-white">
              <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">New Collection</h2>
              <p className="mb-3 md:mb-4 opacity-95 text-sm md:text-base">Explore the latest fashion trends</p>
              <Link href="/shop" aria-label="Shop New Collection fashion trends" className="inline-block px-4 md:px-6 py-2 md:py-2.5 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 text-sm md:text-base">
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {displayNewArrivals.length > 0 && (
      <section className="py-6 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">New Arrivals</h2>
              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-green-700 text-white text-[10px] md:text-xs font-bold rounded-full">NEW</span>
            </div>
            <Link href="/shop" aria-label="View all new arrival products" className="text-blue-700 hover:underline flex items-center gap-1 font-semibold text-sm md:text-base">
              View All <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
            {displayNewArrivals.map((item, index) => (
              <ProductCard key={item._id || item.id || index} product={item} />
            ))}
          </div>
        </div>
      </section>
      )}
      </div>
    </div>
  );
}
