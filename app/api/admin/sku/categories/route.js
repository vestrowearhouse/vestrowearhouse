import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkAdminAccess } from '@/lib/auth';
import { SEED_SKU_CATEGORIES } from '@/lib/skuUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('sku_categories')
      .select('*')
      .order('code', { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback to in-memory seeds if table not yet migrated
      return NextResponse.json({
        categories: SEED_SKU_CATEGORIES.map(c => ({
          code: c.code,
          name: c.name,
          group_name: c.group,
          is_active: true,
          last_serial: 0
        }))
      });
    }

    return NextResponse.json({ categories: data });
  } catch (error) {
    console.error('Fetch SKU categories error:', error);
    return NextResponse.json({ categories: SEED_SKU_CATEGORIES });
  }
}

export async function POST(request) {
  try {
    const adminAuth = await checkAdminAccess(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const body = await request.json();
    const { code, name, group_name } = body;

    if (!code || !name || !group_name) {
      return NextResponse.json({ error: 'Code, Name, and Group Name are required' }, { status: 400 });
    }

    const cleanCode = String(code).trim().padStart(2, '0');
    if (!/^\d{2}$/.test(cleanCode)) {
      return NextResponse.json({ error: 'Category code must be a 2-digit number (e.g. 20)' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('sku_categories')
      .insert([{
        code: cleanCode,
        name: name.trim(),
        group_name: group_name.trim(),
        is_active: true,
        last_serial: 0
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `Category code ${cleanCode} already exists` }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error('Create SKU category error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const adminAuth = await checkAdminAccess(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const body = await request.json();
    const { code, name, group_name, is_active } = body;

    if (!code) {
      return NextResponse.json({ error: 'Category code is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (group_name !== undefined) updateData.group_name = group_name.trim();
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const { data, error } = await supabase
      .from('sku_categories')
      .update(updateData)
      .eq('code', code)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error('Update SKU category error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

