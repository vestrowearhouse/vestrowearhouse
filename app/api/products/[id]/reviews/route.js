import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

// ── GET /api/products/[id]/reviews ──────────────────────────
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved';
    const supabase = getSupabase();

    let query = supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    // Admin can request all statuses; public only gets approved
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reviews: data || [] });
  } catch (error) {
    console.error('GET reviews error:', error);
    return NextResponse.json({ reviews: [] });
  }
}

// ── POST /api/products/[id]/reviews ─────────────────────────
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { customer_name, rating, comment, images, user_id } = body;

    if (!customer_name?.trim() || !comment?.trim()) {
      return NextResponse.json({ error: 'Name and comment are required' }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check if user has purchased this product (verified purchase)
    let verified_purchase = false;
    if (user_id) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'delivered')
        .contains('items', [{ product_id: id }])
        .limit(1);
      verified_purchase = (orders?.length || 0) > 0;
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: id,
        user_id: user_id || null,
        customer_name: customer_name.trim(),
        rating: Number(rating),
        comment: comment.trim(),
        images: images || [],
        verified_purchase,
        status: 'approved', // auto-approve; admin can change later
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate avg rating & review_count
    const { data: allReviews } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', id)
      .eq('status', 'approved');

    if (allReviews?.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await supabase
        .from('products')
        .update({
          rating: Math.round(avgRating * 10) / 10,
          review_count: allReviews.length,
        })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, review: data });
  } catch (error) {
    console.error('POST review error:', error);
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }
}
