import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

const parsePeriodDays = (value) => {
  if (!value) return 30;
  if (value.endsWith('d')) return parseInt(value, 10) || 30;
  if (value === '1y') return 365;
  return parseInt(value, 10) || 30;
};

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const supabase = getVendorSupabaseClient();
    const { searchParams } = new URL(request.url);
    const period = parsePeriodDays(searchParams.get('period') || searchParams.get('range'));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const { data: vendor } = await supabase
      .from('vendors')
      .select('average_rating, total_reviews')
      .eq('id', session.vendorId)
      .single();

    const { data: analytics, error } = await supabase
      .from('vendor_analytics')
      .select('*')
      .eq('vendor_id', session.vendorId)
      .gte('analytics_date', startDate.toISOString().split('T')[0])
      .order('analytics_date', { ascending: true });

    if (error) {
      console.error('Supabase vendor_analytics error:', error);
    }

    const summary = {
      total_views: 0,
      total_visitors: 0,
      total_orders: 0,
      total_revenue: 0,
      conversion_rate: 0,
      avg_rating: vendor?.average_rating || 0,
      total_reviews: vendor?.total_reviews || 0,
    };

    (analytics || []).forEach((record) => {
      summary.total_views += record.total_views || 0;
      summary.total_visitors += record.unique_visitors || 0;
      summary.total_orders += record.total_orders || 0;
      summary.total_revenue += record.net_revenue || 0;
    });

    if (summary.total_visitors > 0) {
      summary.conversion_rate = (summary.total_orders / summary.total_visitors) * 100;
    }

    return NextResponse.json({
      analytics: analytics || [],
      summary,
      period,
      totalViews: summary.total_views,
      uniqueVisitors: summary.total_visitors,
      totalOrders: summary.total_orders,
      totalRevenue: summary.total_revenue,
      conversionRate: summary.conversion_rate,
      topProducts: [],
    });
  } catch (error) {
    console.error('Error fetching vendor analytics:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
}
