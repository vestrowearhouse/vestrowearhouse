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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Revenue and Orders
    const { data: orders } = await supabase.from('orders').select('total, status, items');
    
    let totalRevenue = 0;
    let totalOrders = 0;
    
    if (orders) {
      totalOrders = orders.length;
      totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);
    }

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const kpiData = {
      revenue: { value: totalRevenue, change: 0, trend: 'up' },
      orders: { value: totalOrders, change: 0, trend: 'up' },
      conversionRate: { value: 0, change: 0, trend: 'up' },
      avgOrderValue: { value: avgOrderValue, change: 0, trend: 'up' },
    };

    const productStats = {};
    if (orders) {
      orders.forEach(order => {
        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            // Check item.product as well since checkout page stores it as product
            const pid = item.product_id || item.product || item.id;
            if (!pid) return;
            if (!productStats[pid]) {
              productStats[pid] = { sales: 0, revenue: 0 };
            }
            productStats[pid].sales += (item.quantity || 1);
            productStats[pid].revenue += (item.price || 0) * (item.quantity || 1);
          });
        }
      });
    }

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
        // Since we don't have historical snapshot data yet, we set growth to 0 instead of a fake random number
        growth: 0 
      })).sort((a, b) => b.sales - a.sales);
    }

    // Fetch Live Campaigns
    const { data: campaigns } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false });

    // Fetch Live Referrers to categorize Channels
    const { data: pageViews } = await supabase.from('page_views').select('referrer').limit(5000);
    
    let organic = 0;
    let social = 0;
    let direct = 0;

    (pageViews || []).forEach(v => {
      const ref = v.referrer || '';
      if (!ref || ref === 'null') {
        direct++;
      } else if (ref.includes('facebook.com') || ref.includes('t.co') || ref.includes('instagram.com') || ref.includes('linkedin.com')) {
        social++;
      } else if (ref.includes('google.com') || ref.includes('bing.com') || ref.includes('yahoo.com')) {
        organic++;
      } else {
        organic++; // Group others into organic for simplicity
      }
    });

    const totalViews = Math.max(1, organic + social + direct);
    const channels = [
      { channel: 'Organic Search', visitors: organic, revenue: totalRevenue * (organic/totalViews), percentage: Math.round((organic/totalViews)*100) },
      { channel: 'Social Media', visitors: social, revenue: totalRevenue * (social/totalViews), percentage: Math.round((social/totalViews)*100) },
      { channel: 'Direct', visitors: direct, revenue: totalRevenue * (direct/totalViews), percentage: Math.round((direct/totalViews)*100) }
    ].sort((a,b) => b.percentage - a.percentage);

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