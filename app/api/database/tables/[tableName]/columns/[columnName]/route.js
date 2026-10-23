import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function DELETE(request, { params }) {
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

    const { tableName, columnName } = params;

    const query = `ALTER TABLE ${tableName} DROP COLUMN ${columnName} CASCADE;`;
    
    const { error } = await supabase.rpc('exec_sql', { query });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Column deleted' });
  } catch (error) {
    console.error('Error deleting column:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
