/**
 * PATCH  /api/admin/reviews/[reviewId] — approve/reject/reply
 * DELETE /api/admin/reviews/[reviewId] — permanently delete
 */
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';
import connectMongo from '@/lib/mongodb';
import { Review } from '@/lib/models';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

// Sync avg rating back to Supabase products table
async function syncRatingToSupabase(productId) {
  try {
    const supabase = getSupabase();
    const stats = await Review.aggregate([
      { $match: { productId, status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const avg = stats[0]?.avg || 0;
    const count = stats[0]?.count || 0;
    await supabase
      .from('products')
      .update({ rating: Math.round(avg * 10) / 10, review_count: count })
      .eq('id', productId);
  } catch (e) {
    console.warn('Rating sync to Supabase failed:', e.message);
  }
}

// ── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();
    const { reviewId } = params;
    const body = await request.json();
    const { status, reply } = body;

    const review = await Review.findById(reviewId);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    if (status) review.status = status;

    if (reply?.body) {
      // Replace existing admin reply or add new one
      const existingIdx = review.replies.findIndex(r => r.role === 'admin');
      if (existingIdx >= 0) {
        review.replies[existingIdx].body = reply.body;
        review.replies[existingIdx].createdAt = new Date();
      } else {
        review.replies.push({
          body: reply.body,
          author: reply.author || 'StellarMart Admin',
          role: 'admin',
          authorId: reply.authorId || 'admin',
        });
      }
    }

    await review.save();

    // Sync rating to Supabase products table
    if (status) await syncRatingToSupabase(review.productId);

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('PATCH admin review error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();
    const { reviewId } = params;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    // Sync rating after deletion
    await syncRatingToSupabase(review.productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin review error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
