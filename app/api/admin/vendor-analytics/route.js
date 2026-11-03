import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getAdminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => getAdminSupabase();

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    const { count: totalVendors } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true });

    const { count: activeVendors } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('vendor_id', 'is', null);

    const { data: orders, error: ordersError } = await supabase
      .from('vendor_orders')
      .select('total_amount, vendor_status');

    if (ordersError) throw ordersError;

    let totalRevenue = 0;
    let completedOrders = 0;

    for (const order of orders || []) {
      const status = String(order.vendor_status || '').toLowerCase();
      if (['delivered', 'shipped', 'processing', 'confirmed'].includes(status)) {
        totalRevenue += Number(order.total_amount || 0);
      }
      if (status === 'delivered') completedOrders++;
    }

    return NextResponse.json({
      stats: {
        total_vendors: totalVendors || 0,
        active_vendors: activeVendors || 0,
        total_products: totalProducts || 0,
        total_orders: (orders || []).length,
        completed_orders: completedOrders,
        total_revenue: totalRevenue,
      },
    });
  } catch (error) {
    console.error('Vendor analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor analytics' }, { status: 500 });
  }
}
