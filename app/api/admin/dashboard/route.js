import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { adminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const supabase = adminSupabase;



export async function GET(request) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = await verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch dashboard statistics from Supabase
    const [ordersRes, usersRes, productsRes, recentOrdersRes] = await Promise.all([
      supabase.from('orders').select('total, created_at'),
      supabase.from('users').select('id, created_at').eq('role', 'customer'),
      supabase.from('products').select('id').eq('status', 'active'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    // Calculate statistics
    let totalRevenue = 0;
    let totalOrders = 0;
    const monthlyData = {};

    if (ordersRes.data) {
      totalOrders = ordersRes.data.length;
      ordersRes.data.forEach(order => {
        totalRevenue += order.total || 0;
        const month = new Date(order.created_at).toLocaleString('en-US', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + (order.total || 0);
      });
    }

    const totalUsers = usersRes.data?.length || 0;
    const totalProducts = productsRes.data?.length || 0;

    // Format chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = months.map(month => ({
      month,
      sales: monthlyData[month] || 0
    }));

    // Format recent orders
    const recentOrders = (recentOrdersRes.data || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customer: order.user_id,
      total: order.total,
      status: order.status,
      date: new Date(order.created_at).toLocaleDateString()
    }));

    return NextResponse.json({
      stats: {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        totalUsers,
        totalProducts
      },
      chartData,
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}