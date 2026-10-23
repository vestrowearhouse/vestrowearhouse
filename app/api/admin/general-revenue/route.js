import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch all orders safely using select('*')
    const { data: allOrders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[General Revenue] Supabase orders error:', error);
      throw error;
    }

    const orders = allOrders || [];

    let grossRevenue = 0;
    let netRevenue = 0;
    let totalCompletedOrders = 0;
    
    let bKash = 0;
    let cod = 0;
    let card = 0;

    const dailyRevenue = {};
    const ordersList = [];

    orders.forEach(order => {
      const orderTotal = Number(order.total || 0);
      const status = (order.status || 'pending').toLowerCase();

      // Only exclude cancelled/refunded from gross revenue
      if (status !== 'cancelled' && status !== 'refunded') {
        grossRevenue += orderTotal;
      }

      // Net revenue for completed / delivered orders
      if (status === 'completed' || status === 'delivered') {
        netRevenue += orderTotal;
        totalCompletedOrders += 1;
      }

      // Payment method distribution from real orders
      const method = (order.payment_method || '').toLowerCase();
      if (method.includes('bkash') || method.includes('nagad') || method.includes('rocket')) {
        bKash += orderTotal;
      } else if (method.includes('cod') || method.includes('cash')) {
        cod += orderTotal;
      } else if (method) {
        card += orderTotal;
      }

      // Daily growth from real orders
      if (order.created_at && status !== 'cancelled' && status !== 'refunded') {
        const dateStr = new Date(order.created_at).toISOString().split('T')[0];
        dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + orderTotal;
      }

      // Keep recent 50 orders
      if (ordersList.length < 50) {
        let customerName = 'Guest Customer';
        try {
          if (order.shipping_address) {
            const addr = typeof order.shipping_address === 'string'
              ? JSON.parse(order.shipping_address)
              : order.shipping_address;
            customerName = addr.fullName || addr.name || addr.email || addr.phone || 'Customer';
          }
        } catch (_) {}

        ordersList.push({
          id: order.order_number || String(order.id || ''),
          customer: customerName,
          amount: orderTotal,
          status: order.status || 'pending',
          method: order.payment_method || 'COD',
          date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'
        });
      }
    });

    const aov = totalCompletedOrders > 0 
      ? Math.round(netRevenue / totalCompletedOrders) 
      : (orders.length > 0 ? Math.round(grossRevenue / orders.length) : 0);

    const revenueGrowth = Object.keys(dailyRevenue).sort().map(date => ({
      date,
      revenue: dailyRevenue[date]
    }));

    // Real payment distribution (zero dummy data)
    const paymentMethods = [];
    if (bKash > 0) paymentMethods.push({ name: 'bKash / Nagad', value: bKash });
    if (cod > 0) paymentMethods.push({ name: 'Cash on Delivery', value: cod });
    if (card > 0) paymentMethods.push({ name: 'Card / Online', value: card });

    return NextResponse.json({
      metrics: {
        grossRevenue: Math.round(grossRevenue),
        netRevenue: Math.round(netRevenue),
        totalCommission: 0,
        aov: Math.round(aov),
        totalOrders: orders.length,
        completedOrders: totalCompletedOrders
      },
      recentOrders: ordersList,
      revenueGrowth,
      paymentMethods
    });
  } catch (error) {
    console.error('General Revenue API error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data: ' + (error.message || '') }, { status: 500 });
  }
}