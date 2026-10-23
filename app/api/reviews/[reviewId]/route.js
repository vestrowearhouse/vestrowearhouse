/**
 * PATCH /api/reviews/[reviewId]  — vote helpful, vendor/user reply
 * DELETE /api/reviews/[reviewId] — user delete own review
 */
import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { Review } from '@/lib/models';

export const dynamic = 'force-dynamic';

// ── PATCH — vote helpful or add a reply ─────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    await connectMongo();
    const { reviewId } = params;
    const body = await request.json();
    const { action, userId, reply } = body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // ── action: helpful ──────────────────────────────────────────────────────
    if (action === 'helpful') {
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
      const alreadyVoted = review.helpfulVoters.includes(userId);
      if (alreadyVoted) {
        review.helpfulVoters.pull(userId);
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      } else {
        review.helpfulVoters.push(userId);
        review.helpfulCount += 1;
      }
      await review.save();
      return NextResponse.json({ success: true, helpfulCount: review.helpfulCount, voted: !alreadyVoted });
    }

    // ── action: reply (vendor or admin only — validated by caller) ───────────
    if (action === 'reply') {
      if (!reply?.body) return NextResponse.json({ error: 'reply.body required' }, { status: 400 });
      review.replies.push({
        body: reply.body,
        author: reply.author || 'Shop',
        role: reply.role || 'vendor',
        authorId: reply.authorId,
      });
      await review.save();
      return NextResponse.json({ success: true, replies: review.replies });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH review error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// ── DELETE — user deletes their own review ───────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    await connectMongo();
    const { reviewId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const review = await Review.findById(reviewId);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    // Only owner can delete via this route (admin uses admin route)
    if (userId && review.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await review.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE review error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
