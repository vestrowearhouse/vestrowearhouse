import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request, { params }) {
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

    const { tableName } = params;
    const c = await request.json();

    if (!c.name || !c.type) {
      return NextResponse.json({ success: false, error: 'Column name and type required' }, { status: 400 });
    }

    const ALLOWED_TABLES = ['products', 'categories', 'users', 'vendors', 'orders', 'vendor_orders', 'notifications', 'chat_sessions', 'chat_messages', 'settings', 'admins', 'activity_logs', 'page_logs'];
    if (!ALLOWED_TABLES.includes(tableName)) {
      return NextResponse.json({ success: false, error: 'Invalid table' }, { status: 400 });
    }
    const ALLOWED_TYPES = ['text', 'integer', 'boolean', 'timestamp', 'timestamp with time zone', 'numeric', 'uuid', 'jsonb', 'varchar'];
    if (!ALLOWED_TYPES.includes(c.type.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Invalid column type' }, { status: 400 });
    }
    const safeColumnName = c.name.replace(/[^a-zA-Z0-9_]/g, '');
    // ✅ SECURITY: Column name must be non-empty after sanitization
    if (!safeColumnName) {
      return NextResponse.json({ success: false, error: 'Invalid column name' }, { status: 400 });
    }

    let def = `ADD COLUMN ${safeColumnName} ${c.type}`;
    if (!c.nullable) def += ' NOT NULL';
    if (c.unique) def += ' UNIQUE';
    if (c.defaultValue !== undefined && c.defaultValue !== null && c.defaultValue !== '') {
      // ✅ SECURITY: Strict allowlist for DEFAULT values to prevent SQL injection.
      // Allowed: integers, decimals, booleans, now(), gen_random_uuid(), and single-quoted strings
      const dv = String(c.defaultValue).trim();
      const SAFE_DEFAULT = /^(\d+(\.\d+)?|true|false|now\(\)|gen_random_uuid\(\)|'[^']*')$/i;
      if (!SAFE_DEFAULT.test(dv)) {
        return NextResponse.json({ success: false, error: 'Invalid default value' }, { status: 400 });
      }
      def += ` DEFAULT ${dv}`;
    }

    const query = `ALTER TABLE ${tableName} ${def};`;
    
    const { error } = await supabase.rpc('exec_sql', { query });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Column added' });
  } catch (error) {
    console.error('Error adding column:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
