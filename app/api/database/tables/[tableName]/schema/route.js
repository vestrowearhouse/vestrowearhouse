import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getAdminSupabase, getValidPublicTables } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
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

    const { tableName } = params;
    const validTables = await getValidPublicTables(supabase);
    if (!tableName || !validTables.has(tableName.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Invalid or forbidden table name' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_table_schema', { target_table_name: tableName });

    if (error) {
      // Safe fallback if RPC get_table_schema is not yet created in Supabase:
      // Sample 1 row from the table to inspect column keys
      const { data: sampleRow } = await supabase.from(tableName).select('*').limit(1);
      if (sampleRow && sampleRow.length > 0) {
        const columns = Object.keys(sampleRow[0]).map(col => ({
          name: col,
          type: typeof sampleRow[0][col] === 'number' ? 'numeric' : typeof sampleRow[0][col] === 'boolean' ? 'boolean' : 'text',
          is_nullable: true,
          default_value: null,
          is_primary_key: col === 'id'
        }));
        return NextResponse.json({ success: true, data: columns });
      }
      return NextResponse.json({ success: true, data: [{ name: 'id', type: 'text', is_nullable: false, default_value: null, is_primary_key: true }] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching table schema:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch table schema' }, { status: 500 });
  }
}
