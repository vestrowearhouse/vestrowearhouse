import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

const FLASH_SALE_SLUG = 'system-flash-sale-config';

// Default configuration if none set
const getDefaultConfig = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  return {
    enabled: true,
    title: 'Flash Sale',
    endDate: tomorrow.toISOString(),
    items: []
  };
};

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Fetch config & products in parallel
    const [configRes, productsRes] = await Promise.all([
      supabase.from('categories').select('id, custom_code, status').eq('slug', FLASH_SALE_SLUG).single(),
      supabase.from('products').select('id, name, slug, price, sellingPrice, regularPrice, oldPrice, original_price, images, featuredImage, stock, stockQuantity, stockStatus, isActive, status').order('created_at', { ascending: false }).limit(200)
    ]);

    let config = getDefaultConfig();
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

    return NextResponse.json({
      config,
      products: productsRes.data || []
    });
  } catch (error) {
    console.error('Fetch flash sale error:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sale config' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled = true, title = 'Flash Sale', endDate, items = [] } = await request.json();

    const supabase = getSupabaseClient();
    const payloadStr = JSON.stringify({
      enabled: Boolean(enabled),
      title: title || 'Flash Sale',
      endDate: endDate || new Date(Date.now() + 86400000).toISOString(),
      items: Array.isArray(items) ? items : []
    });

    const status = enabled ? 'active' : 'inactive';

    // Check if system category row exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', FLASH_SALE_SLUG)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('categories')
        .update({
          custom_code: payloadStr,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: 'System Flash Sale Config',
          slug: FLASH_SALE_SLUG,
          status,
          custom_code: payloadStr
        }]);

      if (error) throw error;
    }

    try {
      const { clearCacheByPrefix } = require('@/lib/api-cache');
      const { revalidatePath, revalidateTag } = require('next/cache');
      clearCacheByPrefix('home');
      clearCacheByPrefix('flash-sale');
      try { revalidateTag('flash-sale-data'); } catch (_) {}
      try { revalidateTag('homepage-data'); } catch (_) {}
      revalidatePath('/', 'layout');
      revalidatePath('/flash-sale');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Flash Sale configuration saved successfully!',
      config: { enabled, title, endDate, items }
    });
  } catch (error) {
    console.error('Update flash sale error:', error);
    return NextResponse.json({ error: 'Failed to update flash sale config' }, { status: 500 });
  }
}
