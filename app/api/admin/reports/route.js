import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // ✅ SECURITY: Reports contain sensitive revenue/order data — admin only
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateISO = startDate.toISOString();

    // 1. Fetch orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, user_id')
      .gte('created_at', startDateISO);

    if (ordersError) throw ordersError;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Fetch page views in date range for conversion rate
    const { count: uniqueVisitors, error: visitorsError } = await supabase
      .from('page_views')
      .select('visitor_id', { count: 'exact', head: true })
      .gte('created_at', startDateISO);

    if (visitorsError) throw visitorsError;

    // A rough conversion rate: (unique users who placed an order / total unique visitors)
    // For a real conversion rate, we count unique user_id in orders
    const uniqueBuyers = new Set(orders.map(o => o.user_id)).size;
    const conversionRate = uniqueVisitors > 0 ? ((uniqueBuyers / uniqueVisitors) * 100).toFixed(2) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate,
        orders // Send orders for PDF generation if needed
      }
    });

  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
