import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cacheHeaders, getCache, setCache } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const FALLBACK_LIMIT = 8;

export async function GET() {
  const cacheKey = 'home:v2';
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: cacheHeaders(300, 900) });
  }

  try {
    const supabase = getSupabaseAdmin();

    const PRODUCT_FIELDS = 'id, name, nameBn, shortDescription, regularPrice, sellingPrice, price, oldPrice, stockQuantity, stock, stockStatus, category, sku, brand, tags, featuredImage, isFeatured, isNewArrival, isBestSeller, isActive, slug, vendor_id';

    const [categoriesRes, featuredRes, arrivalsRes, bannersRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, parent_id, icon, icon_type, image')
        .eq('status', 'active')
        .order('isFeatured', { ascending: false, nullsFirst: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('isActive', true)
        .or('isFeatured.eq.true,featured.eq.true')
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('isActive', true)
        .eq('isNewArrival', true)
        .order('created_at', { ascending: false })
        .limit(16),
      supabase
        .from('banners')
        .select('*')
        .eq('status', 'active')
        .order('position', { ascending: true })
        .limit(20),
    ]);

    const firstError = [categoriesRes, featuredRes, arrivalsRes, bannersRes].find((res) => res.error)?.error;
    if (firstError) throw firstError;

    let featuredProducts = (featuredRes.data || []);
    let arrivalsProducts = (arrivalsRes.data || []);

    const allVendorIds = [...new Set([...featuredProducts, ...arrivalsProducts].map(p => p.vendor_id).filter(Boolean))];
    let vendorMap = {};
    if (allVendorIds.length > 0) {
      try {
        const { data: vList } = await supabase
          .from('vendors')
          .select('id, user_id, shop_name, logo_url')
          .or(`id.in.(${allVendorIds.join(',')}),user_id.in.(${allVendorIds.join(',')})`);
        if (vList) {
          for (const v of vList) {
            if (v.id) vendorMap[v.id] = v;
            if (v.user_id) vendorMap[v.user_id] = v;
          }
        }
      } catch (err) {
        console.error('Error fetching vendors in api/home:', err);
      }
    }

    const enrichItem = (p) => {
      if (!p) return p;
      if (p.vendor_id && vendorMap[p.vendor_id]) {
        const v = vendorMap[p.vendor_id];
        return {
          ...p,
          store_name: v.shop_name,
          vendor_logo: v.logo_url,
          is_official: false,
          vendor: v
        };
      }
      if (p.vendor_id) {
        return {
          ...p,
          store_name: 'Vendor Store',
          vendor_logo: null,
          is_official: false
        };
      }
      return {
        ...p,
        store_name: 'StellarMart Official',
        is_official: true
      };
    };

    featuredProducts = featuredProducts.map(enrichItem);
    arrivalsProducts = arrivalsProducts.map(enrichItem);

    const data = {
      categories: categoriesRes.data || [],
      featured: featuredProducts,
      arrivals: arrivalsProducts,
      banners: bannersRes.data || [],
    };

    return NextResponse.json(setCache(cacheKey, data, 300), {
      headers: cacheHeaders(300, 900),
    });
  } catch (error) {
    console.error('Homepage API error:', error);
    return NextResponse.json({ error: 'Failed to fetch homepage data' }, { status: 500 });
  }
}
