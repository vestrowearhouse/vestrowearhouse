import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';
// Mark this route as dynamic since it reads request.cookies
export const dynamic = 'force-dynamic';
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
};

export async function GET(request) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const table = searchParams.get('table');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const supabase = getSupabaseAdmin();

  try {
    // Action 1: Get all known tables and their approximate counts
    if (action === 'get_tables') {
      const tables = [
        'users', 'products', 'orders', 'categories', 
        'coupons', 'banners', 'settings', 'cart'
      ];
      
      const tableStats = await Promise.all(
        tables.map(async (tableName) => {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          return {
            name: tableName,
            count: error ? 0 : count,
            status: error ? 'error' : 'active'
          };
        })
      );

      return NextResponse.json({ tables: tableStats });
    }

    // Action 2: Get dynamic data for a specific table
    if (action === 'get_data' && table) {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false, nullsFirst: false })
        .range(start, end);

      if (error) throw error;

      // Get columns dynamically from the first row or assume empty
      const columns = data.length > 0 ? Object.keys(data[0]) : [];

      return NextResponse.json({
        table,
        data,
        columns,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Database API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}