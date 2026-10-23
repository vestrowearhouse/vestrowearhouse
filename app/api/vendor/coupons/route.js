import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const supabase = getVendorSupabaseClient();
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      coupons: coupons || []
    });
  } catch (error) {
    console.error('Error fetching vendor coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const body = await request.json();
    const {
      code,
      discount_type = 'percentage',
      discount_value,
      min_order_amount = 0,
      usage_limit = 100,
      start_date,
      end_date,
      status = 'active'
    } = body;

    if (!code || !discount_value) {
      return NextResponse.json(
        { error: 'Coupon code and discount value are required' },
        { status: 400 }
      );
    }

    const supabase = getVendorSupabaseClient();
    const cleanCode = String(code).trim().toUpperCase();

    // Check if code already exists
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', cleanCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Coupon code "${cleanCode}" already exists. Please use a different code.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data: newCoupon, error: insertError } = await supabase
      .from('coupons')
      .insert([
        {
          code: cleanCode,
          discount_type,
          discount_value: parseFloat(discount_value),
          min_order_amount: parseFloat(min_order_amount) || 0,
          usage_limit: parseInt(usage_limit, 10) || 100,
          used_count: 0,
          user_usage_limit: 1,
          start_date: start_date || now,
          end_date: end_date || null,
          status,
          created_at: now,
          updated_at: now
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      coupon: newCoupon
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor coupon:', error);
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const supabase = getVendorSupabaseClient();
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
