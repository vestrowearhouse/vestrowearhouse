import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/admin/pages/[id]
export async function GET(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page: data });
  } catch (error) {
    console.error('Fetch page error:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}

// PATCH /api/admin/pages/[id] - Update page details or toggle status
export async function PATCH(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Prepare update payload with allowed fields
    const updatePayload = {};
    if (body.title_en !== undefined) updatePayload.title_en = body.title_en;
    if (body.title_bn !== undefined) updatePayload.title_bn = body.title_bn;
    if (body.slug !== undefined) updatePayload.slug = body.slug.toLowerCase().trim();
    if (body.content_en !== undefined) updatePayload.content_en = body.content_en;
    if (body.content_bn !== undefined) updatePayload.content_bn = body.content_bn;
    if (body.meta_title !== undefined) updatePayload.meta_title = body.meta_title;
    if (body.meta_description !== undefined) updatePayload.meta_description = body.meta_description;
    if (body.is_active !== undefined) updatePayload.is_active = Boolean(body.is_active);
    
    // Add updated_at timestamp
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('pages')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update page error:', error);
      return NextResponse.json({ error: error.message || 'Failed to update page' }, { status: 400 });
    }

    return NextResponse.json({ success: true, page: data?.[0] });
  } catch (error) {
    console.error('Update page error:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  return PATCH(request, context);
}

// DELETE /api/admin/pages/[id]
export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete page error:', error);
      return NextResponse.json({ error: error.message || 'Failed to delete page' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
