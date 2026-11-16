import { createClient } from '@supabase/supabase-js';
import FlashSaleClient from './FlashSaleClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'Limited Drops & Offers | Vestro Wear House',
  description: 'Shop exclusive, limited-time fashion drops and streetwear discounts with fast nationwide cash on delivery across Bangladesh at Vestro Wear House.',
  keywords: ['flash sale', 'bangladesh online shopping', 'streetwear sale', 'clothing discount', 'vestro wear house deals'],
  openGraph: {
    title: 'Limited Drops & Offers | Vestro Wear House',
    description: 'Exclusive streetwear discounts and limited drops before the timer runs out!',
    url: 'https://www.vestrowearhouse.com/flash-sale',
    siteName: 'Vestro Wear House',
    locale: 'en_US',
    type: 'website',
  },
};

const FLASH_SALE_SLUG = 'system-flash-sale-config';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

async function getFlashSaleData() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        enabled: true,
        title: 'Mega Flash Sale',
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        items: []
      };
    }

    const [configRes, productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, custom_code, status')
        .eq('slug', FLASH_SALE_SLUG)
        .single(),
      supabase
        .from('products')
        .select('id, name, slug, price, sellingPrice, regularPrice, oldPrice, images, featuredImage, stock, stockQuantity, category, isFeatured')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('categories')
        .select('id, name, slug')
    ]);

    const catMap = new Map();
    (categoriesRes.data || []).forEach(c => {
      if (c.id && c.name) catMap.set(c.id, c.name);
      if (c.slug && c.name) catMap.set(c.slug, c.name);
    });

    const getCleanCategory = (rawCat) => {
      if (!rawCat) return '';
      const mapped = catMap.get(rawCat);
      if (mapped) return mapped;
      if (/^[0-9a-fA-F-]{20,}$/.test(rawCat)) return '';
      return rawCat;
    };

    let config = {
      enabled: true,
      title: 'Flash Sale Mega Deals',
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: []
    };

    if (configRes.data && configRes.data.custom_code) {
      try {
        const parsed = JSON.parse(configRes.data.custom_code);
        config = {
          ...config,
          ...parsed,
          enabled: configRes.data.status !== 'inactive' && parsed.enabled !== false
        };
      } catch (e) {
        console.error('Failed to parse flash sale JSON', e);
      }
    }

    // Ensure endDate is active (if in past or missing, set to 48h from now)
    if (!config.endDate || new Date(config.endDate).getTime() <= Date.now()) {
      config.endDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }

    const allProducts = productsRes.data || [];
    const catalogMap = new Map();
    allProducts.forEach(p => {
      catalogMap.set(p.id, p);
      if (p._id) catalogMap.set(p._id, p);
    });

    const flashItems = [];
    const usedProductIds = new Set();

    // 1. Curated items from Admin
    if (Array.isArray(config.items) && config.items.length > 0) {
      for (const item of config.items) {
        const catalogProd = catalogMap.get(item.productId);
        const pId = item.productId || catalogProd?.id;
        if (!pId) continue;
        usedProductIds.add(pId);

        const flashPrice = Number(item.flashPrice || catalogProd?.sellingPrice || catalogProd?.price || 0);
        const originalPrice = Number(item.originalPrice || catalogProd?.oldPrice || catalogProd?.regularPrice || Math.round(flashPrice * 1.25));
        const discount = originalPrice > flashPrice && originalPrice > 0
          ? Math.round(((originalPrice - flashPrice) / originalPrice) * 100)
          : Number(item.discountPercent || 15);

        flashItems.push({
          id: pId,
          _id: pId,
          productId: pId,
          slug: item.slug || catalogProd?.slug || pId,
          name: item.name || catalogProd?.name || 'Flash Deal Item',
          image: item.image || catalogProd?.featuredImage || (Array.isArray(catalogProd?.images) ? catalogProd.images[0] : null) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
          sellingPrice: flashPrice,
          price: flashPrice,
          flashPrice: flashPrice,
          regularPrice: originalPrice,
          originalPrice: originalPrice,
          discountPercent: discount,
          discount: discount,
          stockLeft: Number(item.stockLeft || 5),
          totalStock: Math.max(Number(item.stockLeft || 5) + 12, 20),
          category: getCleanCategory(catalogProd?.category) || 'Flash Deals',
          rating: catalogProd?.rating || 5,
          inStock: true
        });
      }
    }

    // 2. Supplement with active deals from catalog if fewer than 16
    if (flashItems.length < 16) {
      for (const p of allProducts) {
        if (flashItems.length >= 28) break;
        if (usedProductIds.has(p.id) || (p._id && usedProductIds.has(p._id))) continue;

        const currentPrice = Number(p.sellingPrice || p.price || 0);
        if (currentPrice <= 0) continue;

        const regPrice = Number(p.oldPrice || p.regularPrice || 0);
        let discount = 0;
        let originalPrice = regPrice;

        if (regPrice > currentPrice) {
          discount = Math.round(((regPrice - currentPrice) / regPrice) * 100);
        } else if (p.isFeatured) {
          originalPrice = Math.round(currentPrice * 1.15);
          discount = 13;
        }

        if (discount >= 5 || p.isFeatured || flashItems.length < 8) {
          usedProductIds.add(p.id);
          const stock = Number(p.stock || p.stockQuantity || 8);
          const stockLeft = Math.max(2, Math.min(stock, 8));

          flashItems.push({
            id: p.id,
            _id: p.id,
            productId: p.id,
            slug: p.slug || p.id,
            name: p.name,
            image: p.featuredImage || (Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' && p.images.startsWith('[') ? JSON.parse(p.images)[0] : p.images)) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
            sellingPrice: currentPrice,
            price: currentPrice,
            flashPrice: currentPrice,
            regularPrice: originalPrice > currentPrice ? originalPrice : Math.round(currentPrice * 1.2),
            originalPrice: originalPrice > currentPrice ? originalPrice : Math.round(currentPrice * 1.2),
            discountPercent: discount || 15,
            discount: discount || 15,
            stockLeft: stockLeft,
            totalStock: stockLeft + 15,
            category: getCleanCategory(p.category) || 'Flash Deals',
            rating: p.rating || 5,
            inStock: p.stockStatus ? p.stockStatus !== 'out_of_stock' : stock > 0
          });
        }
      }
    }

    return {
      enabled: config.enabled,
      title: config.title || 'Mega Flash Sale',
      endDate: config.endDate,
      items: flashItems
    };
  } catch (error) {
    console.error('Error fetching flash sale page data:', error);
    return {
      enabled: true,
      title: 'Mega Flash Sale',
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      items: []
    };
  }
}

export default async function FlashSalePage() {
  const flashSaleData = await getFlashSaleData();

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SaleEvent',
    name: flashSaleData.title,
    description: 'Exclusive limited time flash sale with huge discounts on top products.',
    startDate: new Date().toISOString(),
    endDate: flashSaleData.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: 'https://www.stellarmartbd.com/flash-sale'
    },
    organizer: {
      '@type': 'Organization',
      name: 'StellarMartBD',
      url: 'https://www.stellarmartbd.com'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FlashSaleClient initialData={flashSaleData} />
    </>
  );
}
