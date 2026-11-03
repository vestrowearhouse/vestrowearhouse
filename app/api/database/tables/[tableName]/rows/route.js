import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getAdminSupabase, getValidPublicTables } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const EXACT_SENSITIVE_COLUMNS = new Set([
  'password',
  'password_hash',
  'hashed_password',
  'hash',
  'otp',
  'token',
  'reset_token',
  'reset_password_token',
  'refresh_token',
  'access_token',
  'verification_token',
  'secret',
  'api_key',
  'secret_key',
  'auth_token'
]);

function isSensitiveColumn(columnName) {
  const col = columnName.toLowerCase().trim();
  if (EXACT_SENSITIVE_COLUMNS.has(col)) return true;
  // Specific credential patterns (e.g., user_token, user_password, user_hash, user_otp, client_secret)
  // Preserves harmless content columns like keywords, meta_keywords, foreign_key, primary_key, cache_key
  if (
    col.endsWith('_token') ||
    col.endsWith('_secret') ||
    col.endsWith('_password') ||
    col.endsWith('_hash') ||
    col.endsWith('_otp') ||
    col.endsWith('_api_key')
  ) {
    return true;
  }
  return false;
}

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

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';
    const search = url.searchParams.get('search');

    let query = supabase.from(tableName).select('*', { count: 'exact' });

    if (search) {
      query = query.or(`id.eq.${search}`);
    }

    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    // Mask sensitive fields for ALL tables by exact column name or specific credential pattern
    const sanitizedData = (data || []).map(row => {
      const masked = { ...row };
      for (const key of Object.keys(masked)) {
        if (isSensitiveColumn(key)) {
          masked[key] = '********';
        }
      }
      return masked;
    });

    return NextResponse.json({ success: true, data: sanitizedData, total: count || 0 });
  } catch (error) {
    console.error('Error fetching table rows:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch table rows' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Row insertion from the database explorer has been permanently disabled for security reasons.' },
    { status: 410 }
  );
}
