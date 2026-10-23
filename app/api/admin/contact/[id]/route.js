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
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });

    const body = await request.json();
    const { status } = body;

    // 1. Try updating contact_messages table
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, message: data });
      }
    } catch (e) {}

    // 2. Try updating in categories (system-inbox record)
    try {
      const { data: catRow } = await supabase
        .from('categories')
        .select('id, custom_code')
        .eq('id', id)
        .single();

      if (catRow) {
        let details = {};
        try {
          if (catRow.custom_code) details = JSON.parse(catRow.custom_code);
        } catch (e) {}

        details.status = status;

        const { data: updatedCat, error: catError } = await supabase
          .from('categories')
          .update({
            custom_code: JSON.stringify(details),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (catError) throw catError;
        return NextResponse.json({ success: true, message: updatedCat });
      }
    } catch (catErr) {
      console.error('System inbox update error:', catErr);
    }

    return NextResponse.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Update contact message error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });

    // 1. Try deleting from contact_messages
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (!error) {
        return NextResponse.json({ success: true, message: 'Message deleted successfully' });
      }
    } catch (e) {}

    // 2. Try deleting from categories (system-inbox)
    try {
      const { error: catError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (!catError) {
        return NextResponse.json({ success: true, message: 'Message deleted successfully' });
      }
    } catch (catErr) {
      console.error('System inbox delete error:', catErr);
    }

    return NextResponse.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Delete contact message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
