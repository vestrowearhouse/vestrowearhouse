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

    const { data: vendor } = await supabase
      .from('vendors')
      .select('total_revenue')
      .eq('id', session.vendorId)
      .single();

    const { data: revenue, count, error } = await supabase
      .from('vendor_revenue')
      .select('*', { count: 'exact' })
      .eq('vendor_id', session.vendorId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase vendor_revenue error:', error);
    }

    const { data: paidRows } = await supabase
      .from('vendor_revenue')
      .select('final_amount, total_commission, net_revenue')
      .eq('vendor_id', session.vendorId)
      .eq('payment_status', 'paid');

    const safeRevenue = revenue || [];
    const paid = paidRows || [];
    const totalPaidAmount = paid.reduce((sum, item) => sum + (item.final_amount || 0), 0);
    const totalRevenue = vendor?.total_revenue || safeRevenue.reduce((sum, item) => sum + (item.net_revenue || item.final_amount || 0), 0) || 0;

    return NextResponse.json({
      revenue: safeRevenue,
      transactions: safeRevenue.map((item) => ({
        date: item.period_end || item.period_start || item.created_at,
        orderId: item.order_id || item.id,
        amount: item.final_amount || item.net_revenue || 0,
        status: item.payment_status || 'pending',
      })),
      totalRevenue,
      avgOrderValue: safeRevenue.length ? totalRevenue / safeRevenue.length : 0,
      summary: {
        total_paid: totalPaidAmount,
        pending_payment: Math.max(totalRevenue - totalPaidAmount, 0),
        total_commission: paid.reduce((sum, item) => sum + (item.total_commission || 0), 0),
        total_net_revenue: paid.reduce((sum, item) => sum + (item.net_revenue || 0), 0),
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor revenue:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
}
