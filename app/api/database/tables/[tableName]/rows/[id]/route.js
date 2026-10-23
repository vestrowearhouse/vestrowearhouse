import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function PATCH(request, { params }) {
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

    const { tableName, id } = params;
    const body = await request.json();

    const { data, error } = await supabase.from(tableName).update(body).eq('id', id).select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error updating table row:', error);
    return NextResponse.json({ success: false, error: 'Failed to update row' }, { status: 500 });
  }
}

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

    const { tableName, id } = params;

    const { error } = await supabase.from(tableName).delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting table row:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete row' }, { status: 500 });
  }
}
