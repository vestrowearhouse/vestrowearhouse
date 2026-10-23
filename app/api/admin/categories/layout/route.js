import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('custom_code')
      .eq('slug', 'system-category-layout')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found
      throw error;
    }

    let layout = { pc: Array(12).fill(null), mobile: Array(6).fill(null) };
    if (data && data.custom_code) {
      try {
        layout = JSON.parse(data.custom_code);
      } catch (e) {
        console.error('Failed to parse layout JSON', e);
      }
    }

    return NextResponse.json({ layout });
  } catch (error) {
    console.error('Fetch layout error:', error);
    return NextResponse.json({ error: 'Failed to fetch layout' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    
    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { layout } = await request.json();
    if (!layout || !layout.pc || !layout.mobile) {
      return NextResponse.json({ error: 'Invalid layout payload' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const layoutStr = JSON.stringify({
      pc: layout.pc,
      mobile: layout.mobile
    });

    // Check if it exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'system-category-layout')
      .single();

    if (existing) {
      const { error } = await supabase
        .from('categories')
        .update({ custom_code: layoutStr, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: 'System Category Layout',
          slug: 'system-category-layout',
          status: 'inactive',
          custom_code: layoutStr
        }]);
      if (error) throw error;
    }

    try {
      const { clearCacheByPrefix } = require('@/lib/api-cache');
      const { revalidatePath } = require('next/cache');
      clearCacheByPrefix('home');
      clearCacheByPrefix('categories');
      revalidatePath('/', 'layout');
    } catch (e) {}

    return NextResponse.json({ message: 'Layout updated successfully', layout });
  } catch (error) {
    console.error('Update layout error:', error);
    return NextResponse.json({ error: 'Failed to update layout' }, { status: 500 });
  }
}