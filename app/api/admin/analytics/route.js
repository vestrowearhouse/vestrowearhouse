import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getAdminSupabase, getExcludedVisitorIds } from '@/lib/dbExplorer';

// Requires service role to read analytics
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // ✅ SECURITY: Auth check — analytics data is admin-only
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required' }, { status: 500 });
    }

    const last7Days = generateLastNDays(7);
    const excludedVisitorIds = getExcludedVisitorIds();
    const excludedVisitorSet = new Set(excludedVisitorIds);

    // ─────────────────────────────────────────────────────────────────────────────
    // STRATEGY 1: PostgreSQL RPC get_analytics_summary (fastest & bypasses PostgREST limits)
    // ─────────────────────────────────────────────────────────────────────────────
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_analytics_summary', {
        days_back: 30,
        excluded_visitors: excludedVisitorIds
      });
      if (!rpcError && rpcData && typeof rpcData === 'object') {
        const trafficMap = {};
        (rpcData.traffic || []).forEach(t => {
          trafficMap[t.day_str] = { views: Number(t.views || 0), visitors: Number(t.visitors || 0) };
        });

        const trafficChartData = last7Days.map(d => ({
          date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: trafficMap[d]?.views || 0,
          visitors: trafficMap[d]?.visitors || 0
        }));

        return NextResponse.json({
          success: true,
          data: {
            totalViews: Number(rpcData.total_views || 0),
            uniqueVisitors: Number(rpcData.unique_visitors || 0),
            trafficChartData,
            topPages: rpcData.top_pages || [],
            devices: rpcData.devices || [],
            os: rpcData.os || [],
            browsers: rpcData.browsers || [],
          }
        });
      }
    } catch {
      // RPC not yet migrated in database, proceed to Strategy 2
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STRATEGY 2: Fallback Paginated Fetch with .range() (bypasses 1,000 max_rows cap)
    // ─────────────────────────────────────────────────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    let countQuery = supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgoISO);

    if (excludedVisitorIds.length > 0) {
      countQuery = countQuery.not('visitor_id', 'in', `(${excludedVisitorIds.join(',')})`);
    }

    const { count: totalViewsCount } = await countQuery;

    const totalExpected = totalViewsCount || 0;
    const allViews = [];
    const PAGE_SIZE = 1000;
    let offset = 0;

    // Paginate through full 30-day data
    while (offset < totalExpected && offset < 50000) {
      let pageQuery = supabase
        .from('page_views')
        .select('path, visitor_id, device_type, os, browser, created_at')
        .gte('created_at', thirtyDaysAgoISO)
        .order('created_at', { ascending: false });

      if (excludedVisitorIds.length > 0) {
        pageQuery = pageQuery.not('visitor_id', 'in', `(${excludedVisitorIds.join(',')})`);
      }

      const { data: pageRows, error: pageErr } = await pageQuery.range(offset, offset + PAGE_SIZE - 1);

      if (pageErr || !pageRows || pageRows.length === 0) break;
      allViews.push(...pageRows);
      offset += pageRows.length;
    }

    if (allViews.length === 0) {
      return NextResponse.json({ success: true, data: getEmptyData() });
    }

    const uniqueVisitorSet = new Set();
    const trafficByDateMap = {};
    last7Days.forEach(d => trafficByDateMap[d] = { views: 0, visitors: new Set() });
    const pagesCount = {};
    const deviceCount = {};
    const osCount = {};
    const browserCount = {};

    for (let i = 0; i < allViews.length; i++) {
      const v = allViews[i];
      if (v.visitor_id && !excludedVisitorSet.has(v.visitor_id)) {
        uniqueVisitorSet.add(v.visitor_id);
      } else if (excludedVisitorSet.has(v.visitor_id)) {
        continue;
      }

      const dString = new Date(v.created_at).toISOString().split('T')[0];
      if (trafficByDateMap[dString]) {
        trafficByDateMap[dString].views += 1;
        if (v.visitor_id) trafficByDateMap[dString].visitors.add(v.visitor_id);
      }

      pagesCount[v.path || '/'] = (pagesCount[v.path || '/'] || 0) + 1;
      const device = v.device_type || 'desktop';
      deviceCount[device] = (deviceCount[device] || 0) + 1;
      const os = v.os || 'Unknown';
      osCount[os] = (osCount[os] || 0) + 1;
      const browser = v.browser || 'Unknown';
      browserCount[browser] = (browserCount[browser] || 0) + 1;
    }

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
        totalViews: totalViewsCount ?? allViews.length,
        uniqueVisitors: uniqueVisitorSet.size,
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
