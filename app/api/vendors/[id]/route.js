import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to verify admin token
// ================= GET Vendor =================
export async function GET(request, { params }) {
  try {
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select(`
        *,
        users (
          id,
          name,
          email,
          phone
        )
      `)
      .or(`id.eq.${params.id},user_id.eq.${params.id}`)
      .maybeSingle();

    if (error || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ================= UPDATE Vendor =================
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ================= DELETE Vendor =================
export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}