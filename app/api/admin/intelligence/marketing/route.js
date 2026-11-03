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

    // 1. Fetch current orders within selected time range
    const { data: currentOrders, error: orderErr } = await supabase
      .from('orders')
      .select('id, total, status, items, user_id, created_at')
      .gte('created_at', currentStart.toISOString());

    if (orderErr) throw orderErr;

    // 2. Fetch previous period orders for period-over-period comparison
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', currentStart.toISOString());

    const totalOrders = currentOrders ? currentOrders.length : 0;
    const totalRevenue = (currentOrders || []).reduce((acc, order) => acc + (Number(order.total) || 0), 0);
    const prevRevenue = (previousOrders || []).reduce((acc, order) => acc + (Number(order.total) || 0), 0);
    const prevOrdersCount = previousOrders ? previousOrders.length : 0;

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const prevAvgOrderValue = prevOrdersCount > 0 ? Math.round(prevRevenue / prevOrdersCount) : 0;

    const revChange = prevRevenue > 0 ? Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)) : 0;
    const ordersChange = prevOrdersCount > 0 ? Number((((totalOrders - prevOrdersCount) / prevOrdersCount) * 100).toFixed(1)) : 0;
    const aovChange = prevAvgOrderValue > 0 ? Number((((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100).toFixed(1)) : 0;

    // 3. Fetch Page Views for conversion rate & channels (filtered by date and excluding test visitors)
    let pvQuery = supabase
      .from('page_views')
      .select('referer, referrer, visitor_id')
      .gte('created_at', currentStart.toISOString())
      .limit(10000);

    const excludedVisitorIds = getExcludedVisitorIds();
    const excludedSet = new Set(excludedVisitorIds);
    if (excludedVisitorIds.length > 0) {
      pvQuery = pvQuery.not('visitor_id', 'in', `(${excludedVisitorIds.join(',')})`);
    }

    const { data: pageViews } = await pvQuery;

    const uniqueVisitorSet = new Set();
    let organic = 0;
    let social = 0;
    let direct = 0;

    (pageViews || []).forEach(v => {
      if (v.visitor_id && excludedSet.has(v.visitor_id)) return;
      if (v.visitor_id) uniqueVisitorSet.add(v.visitor_id);

      // Inspect both referrer and referer columns to handle all tracker writes
      const ref = (v.referrer || v.referer || '').toLowerCase();
      if (!ref || ref === 'null') {
        direct++;
      } else if (
        ref.includes('facebook') ||
        ref.includes('t.co') ||
        ref.includes('twitter') ||
        ref.includes('instagram') ||
        ref.includes('linkedin') ||
        ref.includes('youtube') ||
        ref.includes('tiktok')
      ) {
        social++;
      } else if (
        ref.includes('google') ||
        ref.includes('bing') ||
        ref.includes('yahoo') ||
        ref.includes('duckduckgo')
      ) {
        organic++;
      } else {
        organic++;
      }
    });

    const uniqueBuyers = new Set((currentOrders || []).map(o => o.user_id).filter(Boolean)).size;
    const totalUniques = uniqueVisitorSet.size;
    const conversionRate = totalUniques > 0 ? Number(((uniqueBuyers / totalUniques) * 100).toFixed(2)) : 0;

    const kpiData = {
      revenue: { value: totalRevenue, change: revChange, trend: revChange >= 0 ? 'up' : 'down' },
      orders: { value: totalOrders, change: ordersChange, trend: ordersChange >= 0 ? 'up' : 'down' },
      conversionRate: { value: conversionRate, change: 0, trend: 'up' },
      avgOrderValue: { value: avgOrderValue, change: aovChange, trend: aovChange >= 0 ? 'up' : 'down' },
    };

    // Product Stats for Top Products
    const productStats = {};
    (currentOrders || []).forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const pid = item.product_id || item.product || item.id;
          if (!pid) return;
          if (!productStats[pid]) {
            productStats[pid] = { sales: 0, revenue: 0 };
          }
          const q = Number(item.quantity) || 1;
          const p = Number(item.price) || 0;
          productStats[pid].sales += q;
          productStats[pid].revenue += p * q;
        });
      }
    });

    const topProductIds = Object.keys(productStats)
      .sort((a, b) => productStats[b].sales - productStats[a].sales)
      .slice(0, 5);

    let topProducts = [];
    if (topProductIds.length > 0) {
      const { data: topProductsData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', topProductIds);

      topProducts = (topProductsData || []).map(p => ({
        id: p.id,
        name: p.name,
        sales: productStats[p.id]?.sales || 0,
        revenue: productStats[p.id]?.revenue || 0,
        growth: 0
      })).sort((a, b) => b.sales - a.sales);
    }

    // Fetch Live Campaigns
    const { data: campaigns } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    const totalViews = Math.max(1, organic + social + direct);
    const channels = [
      { channel: 'Organic Search', visitors: organic, revenue: Math.round(totalRevenue * (organic / totalViews)), percentage: Math.round((organic / totalViews) * 100) },
      { channel: 'Social Media', visitors: social, revenue: Math.round(totalRevenue * (social / totalViews)), percentage: Math.round((social / totalViews) * 100) },
      { channel: 'Direct', visitors: direct, revenue: Math.round(totalRevenue * (direct / totalViews)), percentage: Math.round((direct / totalViews) * 100) }
    ].sort((a, b) => b.percentage - a.percentage);

    return NextResponse.json({
      kpiData,
      topProducts,
      campaigns: campaigns || [],
      channels
    });
  } catch (error) {
    console.error('Marketing intel error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}