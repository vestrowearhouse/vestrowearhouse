/**
 * GET  /api/vendor/reviews — vendor reviews for their products (MongoDB)
 * POST /api/vendor/reviews — vendor reply to a review
 */
import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';
import connectMongo from '@/lib/mongodb';
import { Review } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    await connectMongo();

    // Get vendor product IDs from Supabase
    const supabase = getVendorSupabaseClient();
    const { data: vendorProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, name, featuredImage, images')
      .eq('vendor_id', session.vendorId);

    if (prodErr) throw prodErr;

    if (!vendorProducts || vendorProducts.length === 0) {
      return NextResponse.json({
        success: true,
        reviews: [],
        stats: { average_rating: 0, total_reviews: 0, satisfaction_rate: '100%', breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
      });
    }

    const productIds = vendorProducts.map(p => p.id);
    const productMap = Object.fromEntries(
      vendorProducts.map(p => [p.id, {
        name: p.name,
        image: p.featuredImage || (Array.isArray(p.images) ? p.images[0] : null) || '',
      }])
    );

    // Fetch reviews from MongoDB
    const reviews = await Review.find({ productId: { $in: productIds } })
      .sort({ createdAt: -1 })
      .lean();

    let sumRating = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const enriched = reviews.map(r => {
      const rating = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      sumRating += rating;
      breakdown[rating] = (breakdown[rating] || 0) + 1;

      const vendorReply = r.replies?.find(rep => rep.role === 'vendor' || rep.role === 'admin');

      return {
        id: r._id.toString(),
        customer_name: r.userName,
        rating: r.rating,
        comment: r.body,
        title: r.title,
        images: r.media?.filter(m => m.type === 'image').map(m => m.url) || [],
        videos: r.media?.filter(m => m.type === 'video').map(m => m.url) || [],
        product_id: r.productId,
        product_name: productMap[r.productId]?.name || 'Product',
        product_image: productMap[r.productId]?.image || '',
        created_at: r.createdAt,
        verified_purchase: r.verifiedPurchase || false,
        status: r.status,
        reply: vendorReply?.body || null,
        reply_at: vendorReply?.createdAt || null,
        replies: r.replies || [],
      };
    });

    const total = enriched.length;
    const avgRating = total > 0 ? Number((sumRating / total).toFixed(1)) : 0;
    const positiveReviews = (breakdown[5] || 0) + (breakdown[4] || 0);
    const satisfactionRate = total > 0 ? `${Math.round((positiveReviews / total) * 100)}%` : '100%';

    return NextResponse.json({
      success: true,
      reviews: enriched,
      stats: { average_rating: avgRating, total_reviews: total, satisfaction_rate: satisfactionRate, breakdown },
    });
  } catch (error) {
    console.error('Error in vendor reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    await connectMongo();
    const { reviewId, replyText } = await request.json();

    if (!reviewId || !replyText?.trim()) {
      return NextResponse.json({ error: 'reviewId and replyText are required' }, { status: 400 });
    }

    const review = await Review.findById(reviewId);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    // Verify vendor owns this product
    const supabase = getVendorSupabaseClient();
    const { data: prod } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', review.productId)
      .single();

    if (prod?.vendor_id && prod.vendor_id !== session.vendorId) {
      return NextResponse.json({ error: 'Unauthorized to reply to this review' }, { status: 403 });
    }

    // Replace existing vendor reply or add new one
    const existingIdx = review.replies.findIndex(r => r.role === 'vendor');
    if (existingIdx >= 0) {
      review.replies[existingIdx].body = replyText.trim();
      review.replies[existingIdx].createdAt = new Date();
    } else {
      review.replies.push({
        body: replyText.trim(),
        author: session.vendorName || 'Shop',
        role: 'vendor',
        authorId: session.vendorId,
      });
    }

    await review.save();

    return NextResponse.json({
      success: true,
      message: 'Reply published successfully!',
      reply: replyText.trim(),
    });
  } catch (error) {
    console.error('Error posting review reply:', error);
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
