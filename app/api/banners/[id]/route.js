import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';
import { revalidatePath, revalidateTag } from 'next/cache';
import { clearCacheByPrefix } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(supabaseUrl, supabaseKey);
};

export async function PUT(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    const updatePayload = {
      updated_at: new Date().toISOString()
    };
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.image !== undefined) updatePayload.image = data.image;
    if (data.link !== undefined) updatePayload.link = data.link;
    if (data.position !== undefined) updatePayload.position = parseInt(data.position) || 0;
    if (data.status !== undefined) updatePayload.status = data.status;

    const { data: updatedBanner, error } = await supabase
      .from('banners')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Clear banners cache instantly
    clearCacheByPrefix('banners');
    clearCacheByPrefix('home');

    try {
      revalidateTag('homepage-data');
    } catch (_) {}
    try {
      revalidatePath('/', 'page');
    } catch (_) {}
    
    return NextResponse.json({ message: 'Banner updated', banner: updatedBanner }, { status: 200 });
  } catch (error) {
    console.error('Banner update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
    
    // Clear banners cache instantly
    clearCacheByPrefix('banners');
    clearCacheByPrefix('home');

    try {
      revalidateTag('homepage-data');
    } catch (_) {}
    try {
      revalidatePath('/', 'page');
    } catch (_) {}
    
    return NextResponse.json({ message: 'Banner deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Banner delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}