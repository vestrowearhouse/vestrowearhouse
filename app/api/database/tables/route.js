import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getAdminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    const decoded = token ? await verifyAdminToken(request) : null;
    if (!decoded) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Database explorer is restricted to admin and super_admin
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required' }, { status: 500 });
    }

    const { data, error } = await supabase.rpc('get_public_tables');

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, data });
    }

    // Safe fallback if RPC get_public_tables is not yet created in Supabase:
    // Query live table row counts via PostgREST head count queries
    const candidateTables = [
      'products',
      'orders',
      'categories',
      'users',
      'coupons',
      'banners',
      'reviews',
      'marketing_campaigns',
      'page_views',
      'page_logs',
      'activity_logs',
      'build_logs',
      'admins',
      'notifications',
      'quick_channels',
      'product_variants'
    ];

    const countResults = await Promise.allSettled(
      candidateTables.map(tbl =>
        supabase.from(tbl).select('*', { count: 'exact', head: true })
      )
    );

    const discoveredTables = [];
    countResults.forEach((res, idx) => {
      if (res.status === 'fulfilled' && !res.value.error) {
        discoveredTables.push({
          name: candidateTables[idx],
          total_rows: res.value.count ?? 0,
          rowCount: res.value.count ?? 0
        });
      }
    });

    return NextResponse.json({ success: true, data: discoveredTables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Table creation from the web admin panel has been permanently disabled for security reasons.' },
    { status: 410 }
  );
}