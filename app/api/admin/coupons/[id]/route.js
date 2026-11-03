import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { logActivity } from '@/lib/logger';
import { adminSupabase } from '@/lib/dbExplorer';

const supabase = adminSupabase;

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity({
      action: 'COUPON_DELETE',
      resource: 'coupons',
      resourceId: String(id),
      description: `Deleted coupon #${id}`,
      details: { id },
      req: request,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Coupon deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Whitelist updateable fields
    const updateData = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.discount_type !== undefined) updateData.discount_type = body.discount_type;
    if (body.discount_value !== undefined) updateData.discount_value = body.discount_value;
    if (body.min_order_amount !== undefined) updateData.min_order_amount = body.min_order_amount;
    if (body.max_discount_amount !== undefined) updateData.max_discount_amount = body.max_discount_amount;
    if (body.usage_limit !== undefined) updateData.usage_limit = body.usage_limit;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    await logActivity({
      action: 'COUPON_UPDATE',
      resource: 'coupons',
      resourceId: String(id),
      description: `Updated coupon #${id}`,
      details: {
        changedFields: Object.keys(updateData).filter(k => k !== 'updated_at'),
        status: updateData.status,
        code: updateData.code,
      },
      req: request,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error) {
    console.error('Coupon update error:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}
