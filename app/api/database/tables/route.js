import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
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

    const { data, error } = await supabase.rpc('get_public_tables');

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tables' }, { status: 500 });
  }
}

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

    const { tableName, columns } = await request.json();
    if (!tableName || !columns || !columns.length) {
      return NextResponse.json({ success: false, error: 'Table name and columns required' }, { status: 400 });
    }

    const colDefs = columns.map(c => {
      let def = `${c.name} ${c.type}`;
      if (!c.nullable) def += ' NOT NULL';
      if (c.unique) def += ' UNIQUE';
      if (c.defaultValue) def += ` DEFAULT ${c.defaultValue}`;
      return def;
    }).join(', ');

    const query = `CREATE TABLE ${tableName} (${colDefs});`;
    
    const { error } = await supabase.rpc('exec_sql', { query });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Table created' });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}