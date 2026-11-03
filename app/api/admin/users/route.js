import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { adminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const supabase = adminSupabase;



export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 200;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const role = searchParams.get('role');

    let query = supabase
      .from('users')
      .select('id, name, email, phone, status, created_at, role', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({
        users: [],
        total: 0
      });
    }

    return NextResponse.json({
      users: data || [],
      total: count || 0
    });
  } catch (error) {
    console.error('Users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}