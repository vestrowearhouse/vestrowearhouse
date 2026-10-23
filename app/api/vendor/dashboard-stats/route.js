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

    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', session.userId);

    const { count: ordersCount } = await supabase
      .from('vendor_orders')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', session.vendorId);

    const { count: pendingCount } = await supabase
      .from('vendor_orders')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', session.vendorId)
      .eq('vendor_status', 'pending');

    const { data: revenueData } = await supabase
      .from('vendor_revenue')
      .select('net_revenue, final_amount')
      .eq('vendor_id', session.vendorId);

    const totalRevenue = revenueData?.reduce(
      (sum, row) => sum + (row.net_revenue || row.final_amount || 0),
      0
    ) || 0;

    const today = new Date();
    const chartData = {
      sales: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: 0,
      })),
      revenue: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: 0,
      })),
    };

    return NextResponse.json({
      stats: {
        products: productsCount || 0,
        orders: ordersCount || 0,
        pendingOrders: pendingCount || 0,
        totalRevenue,
        totalSales: ordersCount || 0,
      },
      charts: chartData,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
