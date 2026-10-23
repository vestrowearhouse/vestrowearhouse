/**
 * GET  /api/questions?productId=xxx&slug=xxx&page=1
 * POST /api/questions  — submit a product question
 */
import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { Question } from '@/lib/models';

export const dynamic = 'force-dynamic';

// ── GET — public: fetch answered/pending questions for a product ─────────────
export async function GET(request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const slug = searchParams.get('slug');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
    const status = searchParams.get('status'); // 'answered' | 'pending' | all

    if (!productId && !slug) {
      return NextResponse.json({ error: 'productId or slug required' }, { status: 400 });
    }

    const filter = {};
    if (productId) filter.productId = productId;
    if (slug) filter.productSlug = slug;
    if (status) filter.status = status;
    else filter.status = { $in: ['answered', 'pending'] }; // exclude rejected from public view

    const skip = (page - 1) * limit;
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ helpfulCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-userEmail -helpfulVoters')
        .lean(),
      Question.countDocuments(filter),
    ]);

    return NextResponse.json({
      questions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('GET questions error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// ── POST — ask a new question ────────────────────────────────────────────────
export async function POST(request) {
  try {
    await connectMongo();
    const body = await request.json();
    const {
      productId, productSlug, shopId,
      userId, userName, userEmail, userAvatar,
      question,
      media = [],
    } = body;

    if (!productId || !userName || !question?.trim()) {
      return NextResponse.json({ error: 'productId, userName, question are required' }, { status: 400 });
    }

    const q = await Question.create({
      productId, productSlug, shopId,
      userId, userName, userEmail, userAvatar,
      question: question.trim(),
      media,
      status: 'pending',
    });

    return NextResponse.json({ success: true, question: q }, { status: 201 });
  } catch (error) {
    console.error('POST question error:', error);
    return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 });
  }
}
