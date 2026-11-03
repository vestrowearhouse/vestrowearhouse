import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkAdminAccess } from '@/lib/auth';
import { SEED_SIZES } from '@/lib/skuUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('sizes')
      .select('*')
      .order('code', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ sizes: SEED_SIZES });
    }

    return NextResponse.json({ sizes: data });
  } catch (error) {
    console.error('Fetch sizes error:', error);
    return NextResponse.json({ sizes: SEED_SIZES });
  }
}

export async function POST(request) {
  try {
    const adminAuth = await checkAdminAccess(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const body = await request.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Size code and Name are required' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('sizes')
      .insert([{ code: cleanCode, name: name.trim() }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `Size code ${cleanCode} already exists` }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, size: data });
  } catch (error) {
    console.error('Create size error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create size' }, { status: 500 });
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
      return NextResponse.json({ error: 'Size code is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('sizes')
      .delete()
      .eq('code', code);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete size error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete size' }, { status: 500 });
  }
}

