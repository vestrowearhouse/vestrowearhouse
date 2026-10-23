import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cacheHeaders, getCache, setCache } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return getSupabaseAdmin();
};

const FLASH_SALE_SLUG = 'system-flash-sale-config';

export async function GET(request) {
  try {
    const cacheKey = 'flash-sale:public-data';
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { status: 200, headers: cacheHeaders(60, 300) });
    }

    const supabase = getSupabaseClient();

    // 1. Fetch Flash Sale configuration, catalog products, and category names in parallel
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

    const allCatalogProducts = productsRes.data || [];

    // Map catalog products by ID for fast lookup
    const catalogMap = new Map();
    allCatalogProducts.forEach(p => {
      catalogMap.set(p.id, p);
      if (p._id) catalogMap.set(p._id, p);
    });

    const flashItems = [];
    const usedProductIds = new Set();

    // 2. First add admin-curated flash items
    if (Array.isArray(config.items) && config.items.length > 0) {
      for (const item of config.items) {
        const catalogProd = catalogMap.get(item.productId);
        const pId = item.productId || catalogProd?.id;
        if (!pId) continue;
        usedProductIds.add(pId);

        const flashPrice = Number(item.flashPrice || catalogProd?.sellingPrice || catalogProd?.price || 0);
        const originalPrice = Number(item.originalPrice || catalogProd?.oldPrice || catalogProd?.regularPrice || Math.round(flashPrice * 1.2));
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

    // 3. If items are fewer than 12, supplement with hot deals from catalog
    if (flashItems.length < 12) {
      for (const p of allCatalogProducts) {
        if (flashItems.length >= 24) break;
        if (usedProductIds.has(p.id) || (p._id && usedProductIds.has(p._id))) continue;

        const currentPrice = Number(p.sellingPrice || p.price || 0);
        if (currentPrice <= 0) continue;

        const regPrice = Number(p.oldPrice || p.regularPrice || 0);
        let discount = 0;
        let originalPrice = regPrice;

        if (regPrice > currentPrice) {
          discount = Math.round(((regPrice - currentPrice) / regPrice) * 100);
        } else if (p.isFeatured) {
          // Feature products get a 10-20% calculated flash deal
          originalPrice = Math.round(currentPrice * 1.15);
          discount = 13;
        }

        if (discount >= 5 || p.isFeatured || flashItems.length < 8) {
          usedProductIds.add(p.id);
          const stock = Number(p.stock || p.stockQuantity || 8);
          const stockLeft = Math.max(2, Math.min(stock, 9));

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
            regularPrice: originalPrice > currentPrice ? originalPrice : Math.round(currentPrice * 1.18),
            originalPrice: originalPrice > currentPrice ? originalPrice : Math.round(currentPrice * 1.18),
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

    const responseData = {
      enabled: config.enabled,
      title: config.title || 'Flash Sale Mega Deals',
      endDate: config.endDate,
      items: flashItems,
      totalCount: flashItems.length
    };

    setCache(cacheKey, responseData, 60);

    return NextResponse.json(responseData, {
      status: 200,
      headers: cacheHeaders(60, 300)
    });
  } catch (error) {
    console.error('Error fetching public flash sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flash sale data', enabled: true, items: [] },
      { status: 500 }
    );
  }
}
