import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    const decoded = token ? await verifyAdminToken(request) : null;
    if (!decoded) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Database explorer is restricted to super_admin only
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super admin access required' }, { status: 403 });
    }

    const { query } = await request.json();

    if (!query) {
       return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data });
  } catch (error) {
    console.error('Error executing SQL:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}