import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/secureJwt';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cacheHeaders, getCache, setCache, clearCacheByPrefix } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return getSupabaseAdmin();
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const isAdmin = searchParams.get('admin') === 'true';

    // Bypass cache for admin dashboard queries to guarantee real-time data
    if (!isAdmin) {
      const cacheKey = `banners:${searchParams.toString() || 'all'}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return NextResponse.json({ banners: cached }, { status: 200, headers: cacheHeaders(300, 900) });
      }
    }
    
    const supabase = getSupabaseClient();
    let query = supabase.from('banners').select('*').order('position', { ascending: true });
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data: banners, error } = await query;
    if (error) throw error;

    if (!isAdmin) {
      const cacheKey = `banners:${searchParams.toString() || 'all'}`;
      setCache(cacheKey, banners, 300);
      return NextResponse.json({ banners }, { status: 200, headers: cacheHeaders(300, 900) });
    }

    return NextResponse.json({ banners: banners || [] }, { 
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Banners GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = await verifyAdminToken(request);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const data = await request.json();

    if (!data.image) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const { data: createdBanner, error } = await supabase
      .from('banners')
      .insert([{
        title: data.title || null,
        image: data.image,
        link: data.link || null,
        position: parseInt(data.position) || 0,
        status: data.status || 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Clear banners & homepage in-memory caches instantly
    clearCacheByPrefix('banners');
    clearCacheByPrefix('home');

    // Non-blocking revalidation of the homepage
    try {
      revalidateTag('homepage-data');
    } catch (_) {}
    try {
      revalidatePath('/', 'page');
    } catch (_) {}
    
    return NextResponse.json({ message: 'Banner created', banner: createdBanner }, { status: 201 });
  } catch (error) {
    console.error('Banner create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}