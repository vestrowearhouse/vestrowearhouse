/**
 * GET  /api/reviews?productId=xxx&slug=xxx&page=1&limit=10
 * POST /api/reviews  — submit a new review (ONLY verified purchasers)
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

// ── Helper: check if user has purchased this product ────────────────────────
async function hasPurchasedProduct(userId, productId) {
  if (!userId || !productId) return { purchased: false, orderId: null };

  const supabase = getSupabase();

  // Check orders in Supabase — look for any non-cancelled order containing this product
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, items, status')
    .eq('user_id', userId)
    .in('status', ['delivered', 'confirmed', 'completed', 'processing', 'pending']);

  if (error || !orders?.length) return { purchased: false, orderId: null };

  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : [];
    const found = items.some(item => {
      const id = item.productId || item.product_id || item.id || item._id;
      return String(id) === String(productId);
    });
    if (found) return { purchased: true, orderId: order.id };
  }

  return { purchased: false, orderId: null };
}

// ── GET — public: fetch approved reviews for a product ──────────────────────
export async function GET(request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const slug = searchParams.get('slug');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
    const sort = searchParams.get('sort') || 'newest';

    if (!productId && !slug) {
      return NextResponse.json({ error: 'productId or slug required' }, { status: 400 });
    }

    const filter = { status: 'approved' };
    if (productId) filter.productId = productId;
    if (slug) filter.productSlug = slug;

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: -1 },
      helpful: { helpfulCount: -1, createdAt: -1 },
    };

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(limit)
        .select('-userEmail -helpfulVoters')
        .lean(),
      Review.countDocuments(filter),
    ]);

    // Aggregate rating breakdown stats
    const stats = await Review.aggregate([
      { $match: { ...filter } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          total: { $sum: 1 },
          5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: stats[0] || { avgRating: 0, total: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('GET reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// ── POST — submit a new review (verified purchasers ONLY) ───────────────────
export async function POST(request) {
  try {
    await connectMongo();

    // ── 1. Verify user is logged in ─────────────────────────────────────────
    const tokenData = await verifyUserToken(request);
    if (!tokenData?.id) {
      return NextResponse.json(
        { error: 'আপনাকে লগইন করতে হবে রিভিউ দিতে।', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      productId, productSlug, shopId,
      rating, title, body: reviewBody,
      media = [],
    } = body;

    // ── 2. Basic validation ─────────────────────────────────────────────────
    if (!productId || !rating) {
      return NextResponse.json({ error: 'productId এবং rating আবশ্যক।' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating অবশ্যই ১–৫ এর মধ্যে হতে হবে।' }, { status: 400 });
    }

    const userId    = tokenData.id;
    const userName  = tokenData.name || tokenData.email?.split('@')[0] || 'Customer';
    const userEmail = tokenData.email || null;
    const userAvatar = tokenData.avatar || tokenData.photoURL || null;

    // ── 3. Purchase verification (Supabase orders) ──────────────────────────
    const { purchased, orderId } = await hasPurchasedProduct(userId, productId);
    if (!purchased) {
      return NextResponse.json(
        {
          error: 'শুধুমাত্র যারা এই পণ্যটি কিনেছেন তারাই রিভিউ দিতে পারবেন।',
          code: 'NOT_PURCHASED',
        },
        { status: 403 }
      );
    }

    // ── 4. Duplicate review check ───────────────────────────────────────────
    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      return NextResponse.json(
        { error: 'আপনি এই পণ্যে আগেই রিভিউ দিয়েছেন।', code: 'ALREADY_REVIEWED' },
        { status: 409 }
      );
    }

    // ── 5. Save review to MongoDB ────────────────────────────────────────────
    const review = await Review.create({
      productId,
      productSlug,
      shopId,
      userId,
      userName,
      userEmail,
      userAvatar,
      rating,
      title,
      body: reviewBody,
      media,
      verifiedPurchase: true,   // always true — we just verified above
      orderId,
      status: 'pending',        // admin must approve before showing
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error('POST review error:', error);
    return NextResponse.json({ error: 'রিভিউ জমা দেওয়া সম্ভব হয়নি।' }, { status: 500 });
  }
}
