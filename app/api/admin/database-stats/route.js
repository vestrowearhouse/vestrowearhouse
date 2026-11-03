import { verifyAdminToken } from '@/lib/secureJwt';
import { getAdminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required' }, { status: 500 });
    }

    // 1. Get auth users count
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    const totalUsers = users ? users.length : 0;

    // 2. Call RPC for table stats with safe fallback
    let tableStats = [];
    const { data: rpcStats, error: rpcError } = await supabase.rpc('get_public_tables');

    if (!rpcError && rpcStats && rpcStats.length > 0) {
      tableStats = rpcStats;
    } else {
      const candidateTables = [
        'products', 'orders', 'categories', 'users', 'coupons', 'banners',
        'reviews', 'marketing_campaigns', 'page_views', 'page_logs',
        'activity_logs', 'build_logs', 'admins', 'notifications'
      ];
      const countResults = await Promise.allSettled(
        candidateTables.map(tbl => supabase.from(tbl).select('*', { count: 'exact', head: true }))
      );
      countResults.forEach((res, idx) => {
        if (res.status === 'fulfilled' && !res.value.error) {
          tableStats.push({
            name: candidateTables[idx],
            total_rows: res.value.count ?? 0
          });
        }
      });
    }

    let totalRows = 0;
    tableStats.forEach(table => {
      totalRows += Number(table.total_rows || 0);
    });

    // 3. Query real database disk size via RPC (no formulas)
    let totalSize = null;
    try {
      const { data: sizeData, error: sizeError } = await supabase.rpc('get_database_size');
      if (!sizeError && typeof sizeData === 'number') {
        totalSize = sizeData;
      }
    } catch {
      totalSize = null;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalRows,
        totalSize, // Real bytes if RPC is present, or null (N/A)
        tables: tableStats
      }
    });
  } catch (error) {
    console.error('Failed to fetch DB stats:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
