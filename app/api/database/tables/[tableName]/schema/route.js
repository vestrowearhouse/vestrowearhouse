import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    const decoded = token ? verifyAdminToken(request) : null;
    if (!decoded) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Database explorer is restricted to super_admin only
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super admin access required' }, { status: 403 });
    }

    const { tableName } = params;

    const { data, error } = await supabase.rpc('get_table_schema', { target_table_name: tableName });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching table schema:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch table schema' }, { status: 500 });
  }
}
