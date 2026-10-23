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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page'), 10) || 1;
    const limit = parseInt(searchParams.get('limit'), 10) || 10;
    const status = searchParams.get('status');

    let query = supabase
      .from('vendor_orders')
      .select('*', { count: 'exact' })
      .eq('vendor_id', session.vendorId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('vendor_status', status);

    const { data: orders, count, error } = await query.range((page - 1) * limit, page * limit - 1);
    if (error) throw error;

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { orderId, status, trackingNumber, notes } = await request.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const supabase = getVendorSupabaseClient();
    const { data: order, error } = await supabase
      .from('vendor_orders')
      .update({
        vendor_status: status,
        tracking_number: trackingNumber || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('vendor_id', session.vendorId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 400 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
