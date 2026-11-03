import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { adminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const supabase = adminSupabase;

export async function POST(request, { params }) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json().catch(() => ({}));
  const action = body.action; // approve | reject
  const admin_note = body.admin_note || null;

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data: reqRow, error: reqErr } = await supabase
    .from('vendor_product_requests')
    .select('id, vendor_id, action_type, product_id, payload, status')
    .eq('id', id)
    .single();

  if (reqErr) {
    console.error('Request load error', reqErr);
    return NextResponse.json({ error: 'Failed to load request' }, { status: 500 });
  }

  if (!reqRow) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (reqRow.status !== 'pending') {
    return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
  }

  // Reject path
  if (action === 'reject') {
    const { error: updErr } = await supabase
      .from('vendor_product_requests')
      .update({ status: 'rejected', admin_note })
      .eq('id', id);

    if (updErr) {
      console.error('Reject error', updErr);
      return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
    }

    await supabase.from('vendor_notifications').insert({
      vendor_id: reqRow.vendor_id,
      type: 'product_rejected',
      payload: { vendor_product_request_id: id, action_type: reqRow.action_type, product_id: reqRow.product_id },
    });

    return NextResponse.json({ success: true });
  }

  // Approve path
  const payload = reqRow.payload || {};

  if (!reqRow.action_type || !['create', 'edit', 'delete'].includes(reqRow.action_type)) {
    return NextResponse.json({ error: 'Invalid action_type in request' }, { status: 400 });
  }

  try {
    if (reqRow.action_type === 'create') {
      // payload should contain fields for products insert
      const insertData = {
        ...payload,
        vendor_id: reqRow.vendor_id,
      };

      const { error: insErr } = await supabase.from('products').insert([insertData]);
      if (insErr) throw insErr;
    }

    if (reqRow.action_type === 'edit') {
      if (!reqRow.product_id) {
        return NextResponse.json({ error: 'product_id missing for edit request' }, { status: 400 });
      }

      const updateData = {
        ...payload,
      };

      // prevent changing vendor_id via vendor payload
      delete updateData.vendor_id;

      const { error: upErr } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', reqRow.product_id);

      if (upErr) throw upErr;
    }

    if (reqRow.action_type === 'delete') {
      if (!reqRow.product_id) {
        return NextResponse.json({ error: 'product_id missing for delete request' }, { status: 400 });
      }

      const { error: delErr } = await supabase
        .from('products')
        .delete()
        .eq('id', reqRow.product_id);

      if (delErr) throw delErr;
    }

    // Update request status
    const { error: updErr } = await supabase
      .from('vendor_product_requests')
      .update({ status: 'approved', admin_note })
      .eq('id', id);

    if (updErr) throw updErr;

    await supabase.from('vendor_notifications').insert({
      vendor_id: reqRow.vendor_id,
      type: 'product_approved',
      payload: {
        vendor_product_request_id: id,
        action_type: reqRow.action_type,
        product_id: reqRow.product_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Approve error:', err);
    // On server side, best-effort: don't change request status if product write fails.
    return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
  }
}

