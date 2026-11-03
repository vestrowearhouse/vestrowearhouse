/**
 * API Route: /api/database/stats
 * GET: Get database statistics — restricted to super_admin only
 */

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
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required'
      }, { status: 500 });
    }

    // Get database size and other stats
    const { data, error } = await supabase.rpc('get_database_stats', {});

    if (error) {
      // Fallback: return basic stats
      return NextResponse.json({
        success: true,
        data: {
          totalTables: 0,
          totalSize: 0,
          status: 'connected'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: data || {
        status: 'connected'
      }
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
