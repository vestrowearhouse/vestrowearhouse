import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getAdminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const getSupabase = () => getAdminSupabase();

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterCode = searchParams.get('code') || 'all';
    const limit = parseInt(searchParams.get('limit')) || 100;

    const supabase = getSupabase();

    let query = supabase
      .from('page_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filterCode !== 'all') {
      query = query.eq('error_code', parseInt(filterCode));
    }

    const { data: dbLogs } = await query;

    const logs = dbLogs || [];

    const count404 = logs.filter(l => l.error_code === 404).length;
    const count500 = logs.filter(l => l.error_code >= 500).length;

    return NextResponse.json({
      success: true,
      logs,
      stats: {
        totalErrors: count404 + count500,
        count404,
        count500,
        scannedRoutes: 'N/A',
        systemStatus: count500 === 0 ? 'Normal' : 'Investigate'
      }
    });
  } catch (error) {
    console.error('Page logs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabase();
    await supabase.from('page_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    return NextResponse.json({
      success: true,
      message: 'Error logs cleared successfully.'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to clear logs' }, { status: 500 });
  }
}
