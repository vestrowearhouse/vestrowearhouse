import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function PATCH(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const body = await request.json();
    const { status, role } = body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (role !== undefined) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('User update error:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    await logActivity({
      action: 'USER_UPDATE',
      resource: 'users',
      resourceId: String(id),
      description: `Updated user #${id}`,
      details: {
        changedFields: Object.keys(updates),
        status: updates.status,
        role: updates.role,
      },
      req: request,
    }).catch(() => {});

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    // Soft delete: set status to 'deleted'
    const { data, error } = await supabase
      .from('users')
      .update({ status: 'deleted' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('User soft delete error:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    await logActivity({
      action: 'USER_DELETE',
      resource: 'users',
      resourceId: String(id),
      description: `Soft deleted user #${id}`,
      details: { status: 'deleted' },
      req: request,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
