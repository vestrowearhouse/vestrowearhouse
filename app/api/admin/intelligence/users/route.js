import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { adminSupabase as supabase, getExcludedVisitorIds } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;

    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);
    const currentStartISO = currentStart.toISOString();
    const previousStartISO = previousStart.toISOString();

    // 1. Total Registered Users (counted from public.users table)
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: newUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', currentStartISO);

    // Period-over-period delta for registered users
    const { count: prevPeriodNewUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousStartISO)
      .lt('created_at', currentStartISO);

    const userGrowthDelta = (prevPeriodNewUsers || 0) > 0
      ? Number(((((newUsers || 0) - prevPeriodNewUsers) / prevPeriodNewUsers) * 100).toFixed(1))
      : null;

    // 2. Fetch page_views in current window (excluding internal/test visitors)
    const excludedVisitorIds = getExcludedVisitorIds();
    const excludedSet = new Set(excludedVisitorIds);

    let pvQuery = supabase
      .from('page_views')
      .select('visitor_id, path, event_type, country, device_type, session_id, user_id, created_at')
      .gte('created_at', currentStartISO)
      .limit(10000);

    if (excludedVisitorIds.length > 0) {
      pvQuery = pvQuery.not('visitor_id', 'in', `(${excludedVisitorIds.join(',')})`);
    }

    const { data: recentViews, error: pvError } = await pvQuery;
    if (pvError) throw pvError;

    // 3. Aggregate unique visitors, devices, countries, sessions, and funnel
    const allVisitors = new Set();
    const productViewers = new Set();
    const cartAdders = new Set();
    const countryMap = {};
    const deviceMap = {};
    const sessionTimes = {}; // session_id -> { min, max }
    const sessionHits = {};  // session_id -> hit count
    const userPvCounts = {}; // user_id -> view count
    const lastActiveUsersMap = {};

    (recentViews || []).forEach(v => {
      if (v.visitor_id && excludedSet.has(v.visitor_id)) return;
      if (v.visitor_id) allVisitors.add(v.visitor_id);

      if (v.path && v.path.includes('/product/')) {
        productViewers.add(v.visitor_id);
      }
      if (v.event_type === 'add_to_cart' || (v.path && v.path.includes('/cart'))) {
        cartAdders.add(v.visitor_id);
      }

      // Real country aggregation (no hardcoded fallback)
      const country = (v.country || 'Unknown').trim();
      countryMap[country] = (countryMap[country] || 0) + 1;

      // Real device aggregation (no 70/30 split)
      const device = (v.device_type || 'desktop').toLowerCase();
      const normalizedDevice = device.includes('mobile') ? 'Mobile' : device.includes('tablet') ? 'Tablet' : 'Desktop';
      deviceMap[normalizedDevice] = (deviceMap[normalizedDevice] || 0) + 1;

      // Session Duration and Bounce Rate aggregation from real session_id
      if (v.session_id) {
        sessionHits[v.session_id] = (sessionHits[v.session_id] || 0) + 1;
        if (v.created_at) {
          const t = new Date(v.created_at).getTime();
          if (!sessionTimes[v.session_id]) {
            sessionTimes[v.session_id] = { min: t, max: t };
          } else {
            if (t < sessionTimes[v.session_id].min) sessionTimes[v.session_id].min = t;
            if (t > sessionTimes[v.session_id].max) sessionTimes[v.session_id].max = t;
          }
        }
      }

      // Track active users
      if (v.user_id) {
        userPvCounts[v.user_id] = (userPvCounts[v.user_id] || 0) + 1;
        if (!lastActiveUsersMap[v.user_id] || new Date(v.created_at) > new Date(lastActiveUsersMap[v.user_id])) {
          lastActiveUsersMap[v.user_id] = v.created_at;
        }
      }
    });

    const totalUniqueVisitors = allVisitors.size;

    // Calculate real session duration across multi-page sessions
    let totalDurationSeconds = 0;
    let completedSessionsCount = 0;
    for (const sid of Object.keys(sessionTimes)) {
      const diff = Math.round((sessionTimes[sid].max - sessionTimes[sid].min) / 1000);
      if (diff > 0 && diff < 86400) { // filter out absurd outliers (> 24 hours)
        totalDurationSeconds += diff;
        completedSessionsCount++;
      }
    }

    let avgSessionDuration = 'N/A';
    if (completedSessionsCount > 0) {
      const avgSec = Math.round(totalDurationSeconds / completedSessionsCount);
      const m = Math.floor(avgSec / 60);
      const s = avgSec % 60;
      avgSessionDuration = `${m}m ${s}s`;
    }

    // Compute real bounce rate: single-page sessions / total sessions from session_id
    const totalSessions = Object.keys(sessionHits).length;
    let bounceRate = null;
    if (totalSessions > 0) {
      const singlePageSessions = Object.values(sessionHits).filter(count => count === 1).length;
      bounceRate = Math.round((singlePageSessions / totalSessions) * 100);
    }

    // Get real purchases in window
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', currentStartISO);

    const uniqueBuyers = new Set((recentOrders || []).map(o => o.user_id).filter(Boolean)).size;

    // Calculate real funnel metrics
    const baseTotal = totalUniqueVisitors > 0 ? totalUniqueVisitors : 1;
    const viewedProductCount = productViewers.size;
    const addedToCartCount = cartAdders.size;

    // Top Users (real registered users sorted by newest)
    const { data: topUsersData } = await supabase
      .from('users')
      .select('id, name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const topUsers = (topUsersData || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      visits: userPvCounts[u.id] ? userPvCounts[u.id] : 'N/A',
      lastActive: lastActiveUsersMap[u.id] ? new Date(lastActiveUsersMap[u.id]).toLocaleDateString() : new Date(u.created_at).toLocaleDateString(),
      status: u.status
    }));

    // Real country array
    const totalCountryHits = Object.values(countryMap).reduce((a, b) => a + b, 0) || 1;
    const userLocations = Object.entries(countryMap)
      .map(([country, hits]) => ({
        country,
        users: hits,
        percentage: Math.round((hits / totalCountryHits) * 100)
      }))
      .sort((a, b) => b.users - a.users);

    // Real devices array
    const totalDeviceHits = Object.values(deviceMap).reduce((a, b) => a + b, 0) || 1;
    const userDevices = Object.entries(deviceMap)
      .map(([device, hits]) => ({
        device,
        users: hits,
        percentage: Math.round((hits / totalDeviceHits) * 100)
      }))
      .sort((a, b) => b.users - a.users);

    const stats = {
      totalUsers: totalUsers || 0,
      uniqueVisitors: totalUniqueVisitors || 0,
      newUsers: newUsers || 0,
      activeUsers: activeUsers || 0,
      bounceRate,
      avgSessionDuration,
      deltas: {
        totalUsers: userGrowthDelta,
        activeUsers: null, // Zero fake numbers
        avgSessionDuration: null,
        bounceRate: null
      }
    };

    return NextResponse.json({
      stats,
      topUsers,
      userLocations,
      userDevices,
      userBehavior: [
        { action: 'Viewed Product', count: viewedProductCount, percentage: ((viewedProductCount / baseTotal) * 100).toFixed(1) },
        { action: 'Visited Cart', count: addedToCartCount, percentage: ((addedToCartCount / baseTotal) * 100).toFixed(1) },
        { action: 'Completed Purchase', count: uniqueBuyers, percentage: ((uniqueBuyers / baseTotal) * 100).toFixed(1) }
      ]
    });
  } catch (error) {
    console.error('User intelligence error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}