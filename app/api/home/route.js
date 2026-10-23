import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cacheHeaders, getCache, setCache } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const FALLBACK_LIMIT = 8;

export async function GET() {
  const cacheKey = 'home:v1';
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: cacheHeaders(300, 900) });
  }

  try {
    const supabase = getSupabaseAdmin();

    const PRODUCT_FIELDS = 'id, name, nameBn, shortDescription, regularPrice, sellingPrice, price, oldPrice, stockQuantity, stock, stockStatus, category, sku, brand, tags, featuredImage, isFeatured, isNewArrival, isBestSeller, isActive, slug';

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

    const featuredProducts = (featuredRes.data || []);
    const arrivalsProducts = (arrivalsRes.data || []);

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
