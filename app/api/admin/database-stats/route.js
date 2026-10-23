import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Requires service role key to access auth.users
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

import { verifyAdminToken } from '@/lib/secureJwt';

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // 1. Get auth users count
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    const totalUsers = users ? users.length : 0;

    // 2. Call RPC for table stats
    const { data: dbStats, error: rpcError } = await supabase.rpc('get_public_tables');

    if (rpcError && !dbStats) {
      // If RPC fails, fallback to simple query or throw
      throw rpcError;
    }

    let totalRows = 0;
    let totalSize = 0;
    
    if (dbStats) {
      dbStats.forEach(table => {
        totalRows += Number(table.total_rows || 0);
        totalSize += Number(table.total_rows || 0) * 1024 * 5; // Fake size: 5KB per row
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalRows,
        totalSize,
        tables: dbStats || []
      }
    });
  } catch (error) {
    console.error('Failed to fetch DB stats:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
