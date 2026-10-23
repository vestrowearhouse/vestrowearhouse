import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';

// Requires service role to read analytics
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    // ✅ SECURITY: Auth check — analytics data is admin-only
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // In a real high-traffic app, you would use an RPC or aggregated materialized view.
    // For this dashboard, we'll fetch the raw recent rows and aggregate in memory for simplicity.
    // (Limits to 10k latest views to avoid memory issues)
    const { data: views, error } = await supabase
      .from('page_views')
      .select('*')
      .gte('created_at', thirtyDaysAgoISO)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error) throw error;

    if (!views || views.length === 0) {
      return NextResponse.json({ success: true, data: getEmptyData() });
    }

    // 1. Top Metrics
    const totalViews = views.length;
    const uniqueVisitors = new Set(views.map(v => v.visitor_id)).size;

    // 2. Traffic over time (last 7 days)
    const last7Days = generateLastNDays(7);
    const trafficByDateMap = {};
    last7Days.forEach(d => trafficByDateMap[d] = { date: d, views: 0, visitors: new Set() });

    // 3. Top Pages
    const pagesCount = {};
    // 4. Device / OS / Browser stats
    const deviceCount = {};
    const osCount = {};
    const browserCount = {};

    views.forEach(v => {
      // Date stats
      const dString = new Date(v.created_at).toISOString().split('T')[0];
      if (trafficByDateMap[dString]) {
        trafficByDateMap[dString].views += 1;
        trafficByDateMap[dString].visitors.add(v.visitor_id);
      }

      // Page stats
      pagesCount[v.path] = (pagesCount[v.path] || 0) + 1;

      // Device stats
      const device = v.device_type || 'desktop';
      deviceCount[device] = (deviceCount[device] || 0) + 1;

      // OS stats
      const os = v.os || 'Unknown';
      osCount[os] = (osCount[os] || 0) + 1;

      // Browser stats
      const browser = v.browser || 'Unknown';
      browserCount[browser] = (browserCount[browser] || 0) + 1;
    });

    // Format chart data
    const trafficChartData = last7Days.map(d => ({
      date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: trafficByDateMap[d].views,
      visitors: trafficByDateMap[d].visitors.size
    }));

    const topPages = Object.entries(pagesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, views: count }));

    const formatPieData = (dict) => Object.entries(dict)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      success: true,
      data: {
        totalViews,
        uniqueVisitors,
        trafficChartData,
        topPages,
        devices: formatPieData(deviceCount),
        os: formatPieData(osCount),
        browsers: formatPieData(browserCount),
      }
    });

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to get dates for X-axis
function generateLastNDays(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getEmptyData() {
  return {
    totalViews: 0,
    uniqueVisitors: 0,
    trafficChartData: generateLastNDays(7).map(d => ({ date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), views: 0, visitors: 0 })),
    topPages: [],
    devices: [],
    os: [],
    browsers: []
  };
}
