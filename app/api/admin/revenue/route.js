import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';
import { getAdminSupabase, adminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = adminSupabase;

    // 1. Gross Orders - fetch non-cancelled orders
    const { data: allOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, total, created_at, payment_method, status')
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.error('[Admin Revenue API] Orders error:', ordersErr);
    }

    const orders = allOrders || [];
    
    let grossRevenue = 0;
    let realizedRevenue = 0;
    let bKash = 0;
    let cod = 0;
    let card = 0;

    const dailyRevenue = {};

    orders.forEach(order => {
      const orderTotal = Number(order.total || 0);
      const status = (order.status || 'pending').toLowerCase();

      if (status !== 'cancelled' && status !== 'refunded') {
        grossRevenue += orderTotal;

        if (status === 'completed' || status === 'delivered') {
          realizedRevenue += orderTotal;
        }

        // Payment Method distribution
        const method = (order.payment_method || '').toLowerCase();
        if (method.includes('bkash') || method.includes('nagad') || method.includes('rocket')) {
          bKash += orderTotal;
        } else if (method.includes('cod') || method.includes('cash')) {
          cod += orderTotal;
        } else if (method) {
          card += orderTotal;
        }

        // Daily growth
        if (order.created_at) {
          const dateStr = new Date(order.created_at).toISOString().split('T')[0];
          dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + orderTotal;
        }
      }
    });

    const revenueGrowth = Object.keys(dailyRevenue).sort().map(date => ({
      date,
      revenue: dailyRevenue[date]
    }));

    // 2. Platform Commission (10%)
    const platformCommission = Math.round(grossRevenue * 0.10);

    // 3. Payouts Ledger
    let payouts = [];
    let completedPayoutsTotal = 0;
    
    try {
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('vendor_payouts')
        .select(`
          id, amount, platform_fee, method, status, created_at,
          vendors ( shop_name )
        `)
        .order('created_at', { ascending: false });

      if (!payoutsError && payoutsData) {
        payoutsData.forEach(p => {
          if (p.status === 'completed') completedPayoutsTotal += Number(p.amount || 0);
        });
        payouts = payoutsData.map(p => ({
          id: p.id,
          vendor: p.vendors?.shop_name || 'Vendor',
          amount: Number(p.amount || 0),
          fee: Number(p.platform_fee || 0),
          method: p.method || 'Bank Transfer',
          status: p.status || 'pending',
          date: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'
        }));
      }
    } catch (e) {
      console.warn('[Admin Revenue] Vendor payouts table read error:', e);
    }

    // 4. Vendors Directory Summary
    let vendors = [];
    try {
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, shop_name, status, commission_rate, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      vendors = vendorsData || [];
    } catch (_) {}

    const netPayable = Math.max(0, grossRevenue - platformCommission);
    const pendingPayouts = Math.max(0, netPayable - completedPayoutsTotal);

    const paymentMethods = [];
    if (bKash > 0) paymentMethods.push({ name: 'bKash / Nagad', value: bKash });
    if (cod > 0) paymentMethods.push({ name: 'Cash on Delivery', value: cod });
    if (card > 0) paymentMethods.push({ name: 'Card / Online', value: card });

    return NextResponse.json({
      metrics: {
        grossRevenue: Math.round(grossRevenue),
        realizedRevenue: Math.round(realizedRevenue),
        platformCommission,
        netPayable,
        pendingPayouts: Math.round(pendingPayouts),
        totalOrders: orders.length,
        totalVendors: vendors.length
      },
      payouts,
      vendors,
      revenueGrowth,
      paymentMethods
    });
  } catch (error) {
    console.error('Revenue API error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data: ' + (error.message || '') }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getAdminSupabase();

    const body = await request.json();
    const { payoutId, status = 'completed' } = body;

    if (payoutId) {
      const { error } = await supabase
        .from('vendor_payouts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', payoutId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Payout marked as ${status}` });
    }

    return NextResponse.json({ error: 'Missing payoutId' }, { status: 400 });
  } catch (error) {
    console.error('Payout settlement error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update payout' }, { status: 500 });
  }
}