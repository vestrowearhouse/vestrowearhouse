import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { logActivity } from '@/lib/logger';
import { getAdminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');
    const type = searchParams.get('type') || 'full'; // 'full', 'products', 'orders', 'categories'

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required' }, { status: 500 });
    }

    // If download requested, fetch real database data and return attachment
    if (download === 'true') {
      let exportData = {};
      const dateStr = new Date().toISOString().split('T')[0];
      let filename = `stellarmart-${type}-backup-${dateStr}.json`;

      if (type === 'products') {
        const { data: products } = await supabase.from('products').select('*');
        exportData = { type: 'products', exportedAt: new Date().toISOString(), total: products?.length || 0, products: products || [] };
      } else if (type === 'orders') {
        const { data: orders } = await supabase.from('orders').select('*');
        exportData = { type: 'orders', exportedAt: new Date().toISOString(), total: orders?.length || 0, orders: orders || [] };
      } else if (type === 'categories') {
        const { data: categories } = await supabase.from('categories').select('*');
        exportData = { type: 'categories', exportedAt: new Date().toISOString(), total: categories?.length || 0, categories: categories || [] };
      } else {
        // Full Backup
        const [productsRes, categoriesRes, ordersRes, bannersRes, couponsRes, usersRes] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('categories').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('banners').select('*'),
          supabase.from('coupons').select('*'),
          supabase.from('users').select('id, name, email, role, phone, created_at')
        ]);

        exportData = {
          system: 'StellarMartBD Backup & Recovery',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          tables: {
            products: productsRes.data || [],
            categories: categoriesRes.data || [],
            orders: ordersRes.data || [],
            banners: bannersRes.data || [],
            coupons: couponsRes.data || [],
            users: usersRes.data || []
          },
          counts: {
            products: productsRes.data?.length || 0,
            categories: categoriesRes.data?.length || 0,
            orders: ordersRes.data?.length || 0,
            banners: bannersRes.data?.length || 0,
            coupons: couponsRes.data?.length || 0,
            users: usersRes.data?.length || 0
          }
        };
      }

      // Log real export event to activity_logs
      await logActivity({
        action: 'BACKUP_EXPORT',
        resource: 'backup',
        resourceId: `export-${type}-${dateStr}`,
        description: `Exported ${type.toUpperCase()} database backup dataset (${filename})`,
        details: { type, filename, exportedAt: new Date().toISOString() },
        req: request,
      }).catch(() => {});

      const jsonString = JSON.stringify(exportData, null, 2);
      return new Response(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Standard GET: Return database stats & real backup ledger
    const [productsCountRes, categoriesCountRes, ordersCountRes, usersCountRes, exportLogsRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('activity_logs').select('id, record_id, details, created_at').eq('action_type', 'BACKUP_EXPORT').order('created_at', { ascending: false }).limit(10)
    ]);

    const pCount = productsCountRes.count || 0;
    const cCount = categoriesCountRes.count || 0;
    const oCount = ordersCountRes.count || 0;
    const uCount = usersCountRes.count || 0;
    const totalRecords = pCount + cCount + oCount + uCount;

    // Real history derived from recorded backup exports
    const history = (exportLogsRes.data || []).map(item => ({
      id: item.id,
      filename: item.details?.filename || `stellarmart-${item.details?.type || 'full'}-backup.json`,
      type: item.details?.type ? `${item.details.type.toUpperCase()} Export` : 'Full System Export',
      size: 'N/A', // Real byte size varies by format and compression
      trigger: 'Manual / On-Demand',
      date: new Date(item.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      status: 'Exported',
      downloadType: item.details?.type || 'full'
    }));

    const lastRealExport = history.length > 0 ? history[0].date : 'None recorded';

    return NextResponse.json({
      success: true,
      stats: {
        productsCount: pCount,
        categoriesCount: cCount,
        ordersCount: oCount,
        usersCount: uCount,
        totalRecords,
        lastRealExport,
        lastCloudBackup: 'N/A (Managed by Supabase Cloud)',
        nextCloudBackup: 'Automated Daily Cycle (Supabase)'
      },
      history
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process backup request' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { type = 'full' } = await request.json().catch(() => ({}));
    const backupId = `snapshot-${Date.now()}`;

    // Note: Web admin cannot trigger hardware-level Postgres snapshots directly.
    // We log the manual backup intent and direct administrators to download the dataset or use Supabase dashboard.
    await logActivity({
      action: 'BACKUP_EXPORT',
      resource: 'backup',
      resourceId: backupId,
      description: `Manual ${type.toUpperCase()} backup event logged`,
      details: {
        backupId,
        type,
        timestamp: new Date().toISOString()
      },
      req: request,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `On-demand ${type.toUpperCase()} backup event logged. Use 'Download Full Backup' to download the JSON payload, or use the Supabase Dashboard for point-in-time snapshots.`,
      backupId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create backup snapshot' },
      { status: 500 }
    );
  }
}