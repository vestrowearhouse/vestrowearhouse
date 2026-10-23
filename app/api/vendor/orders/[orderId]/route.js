import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const supabase = getVendorSupabaseClient();
    const { data: order, error } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('id', params.orderId)
      .eq('vendor_id', session.vendorId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
