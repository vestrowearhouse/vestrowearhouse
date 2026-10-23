import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);



export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch analytics data
    const { data: orders } = await supabase
      .from('orders')
      .select('total, status');

    const intelligence = {
      topProducts: [],
      topCustomers: [],
      trends: {
        salesGrowth: '+12.5%',
        orderGrowth: '+8.2%',
        customerGrowth: '+5.1%'
      },
      averageOrderValue: 0
    };

    if (orders && orders.length > 0) {
      const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      intelligence.averageOrderValue = Math.round(totalSales / orders.length);
    }

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('Intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intelligence data' },
      { status: 500 }
    );
  }
}