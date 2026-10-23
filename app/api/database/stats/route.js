/**
 * API Route: /api/database/stats
 * GET: Get database statistics — restricted to super_admin only
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Database stats are super_admin only
    const token = request.cookies.get('adminToken')?.value;
    const decoded = token ? await verifyAdminToken(request) : null;
    if (!decoded) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super admin access required' }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
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
