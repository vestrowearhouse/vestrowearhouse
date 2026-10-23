/**
 * GET /api/admin/questions — all questions with filters (MongoDB)
 */
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import connectMongo from '@/lib/mongodb';
import { Question } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const productId = searchParams.get('product_id');
    const shopId = searchParams.get('shop_id');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (productId) filter.productId = productId;
    if (shopId) filter.shopId = shopId;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Question.countDocuments(filter),
    ]);

    return NextResponse.json({ questions, total, page, limit });
  } catch (error) {
    console.error('GET admin questions error:', error);
    return NextResponse.json({ questions: [], total: 0 }, { status: 500 });
  }
}
