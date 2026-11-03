import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkAdminAccess } from '@/lib/auth';
import { SEED_COLORS } from '@/lib/skuUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .order('code', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ colors: SEED_COLORS });
    }

    return NextResponse.json({ colors: data });
  } catch (error) {
    console.error('Fetch colors error:', error);
    return NextResponse.json({ colors: SEED_COLORS });
  }
}

export async function POST(request) {
  try {
    const adminAuth = await checkAdminAccess(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const body = await request.json();
    const { code, name, hex } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Color code and Name are required' }, { status: 400 });
    }

    const cleanCode = String(code).trim().padStart(2, '0');
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('colors')
      .insert([{ code: cleanCode, name: name.trim(), hex: hex?.trim() || null }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `Color code ${cleanCode} already exists` }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, color: data });
  } catch (error) {
    console.error('Create color error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create color' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const adminAuth = await checkAdminAccess(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Color code is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('colors')
      .delete()
      .eq('code', code);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete color error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete color' }, { status: 500 });
  }
}

