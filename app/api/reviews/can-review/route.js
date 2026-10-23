/**
 * GET /api/reviews/can-review?productId=xxx
 * 
 * Frontend এ review form দেখানোর আগে এটা call করবে।
 * Response:
 *  { canReview: true }   → review form দেখাও
 *  { canReview: false, reason: 'NOT_LOGGED_IN' | 'NOT_PURCHASED' | 'ALREADY_REVIEWED' }
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from '@/lib/secureJwt';
import connectMongo from '@/lib/mongodb';
import { Review } from '@/lib/models';

export const dynamic = 'force-dynamic';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ canReview: false, reason: 'MISSING_PRODUCT_ID' });
    }

    // Check login
    const tokenData = await verifyUserToken(request);
    if (!tokenData?.id) {
      return NextResponse.json({ canReview: false, reason: 'NOT_LOGGED_IN' });
    }

    const userId = tokenData.id;

    // Check already reviewed
    await connectMongo();
    const existing = await Review.findOne({ productId, userId }).lean();
    if (existing) {
      return NextResponse.json({
        canReview: false,
        reason: 'ALREADY_REVIEWED',
        existingReview: {
          id: existing._id,
          rating: existing.rating,
          status: existing.status,
        },
      });
    }

    // Check purchase in Supabase orders
    const supabase = getSupabase();
    const { data: orders } = await supabase
      .from('orders')
      .select('id, items, status')
      .eq('user_id', userId)
      .in('status', ['delivered', 'confirmed', 'completed', 'processing', 'pending']);

    let purchased = false;
    let orderId = null;

    for (const order of (orders || [])) {
      const items = Array.isArray(order.items) ? order.items : [];
      const found = items.some(item => {
        const id = item.productId || item.product_id || item.id || item._id;
        return String(id) === String(productId);
      });
      if (found) {
        purchased = true;
        orderId = order.id;
        break;
      }
    }

    if (!purchased) {
      return NextResponse.json({ canReview: false, reason: 'NOT_PURCHASED' });
    }

    return NextResponse.json({ canReview: true, orderId });
  } catch (error) {
    console.error('can-review check error:', error);
    return NextResponse.json({ canReview: false, reason: 'ERROR' });
  }
}
