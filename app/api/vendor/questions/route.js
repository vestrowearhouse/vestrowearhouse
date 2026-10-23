/**
 * GET  /api/vendor/questions — vendor questions for their products (MongoDB)
 * POST /api/vendor/questions — vendor answer/reply to a question
 */
import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';
import connectMongo from '@/lib/mongodb';
import { Question } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    await connectMongo();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '15'));
    const skip = (page - 1) * limit;

    // Get vendor products from Supabase
    const supabase = getVendorSupabaseClient();
    const { data: vendorProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, name, featuredImage, images')
      .eq('vendor_id', session.vendorId);

    if (prodErr) throw prodErr;
    if (!vendorProducts || vendorProducts.length === 0) {
      return NextResponse.json({ questions: [], total: 0, page, limit });
    }

    const productIds = vendorProducts.map(p => p.id);
    const productMap = Object.fromEntries(
      vendorProducts.map(p => [p.id, {
        name: p.name,
        image: p.featuredImage || (Array.isArray(p.images) ? p.images[0] : null) || '',
      }])
    );

    // Query MongoDB
    const filter = { productId: { $in: productIds } };
    if (status) filter.status = status;

    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Question.countDocuments(filter),
    ]);

    const enriched = questions.map(q => ({
      ...q,
      id: q._id.toString(),
      product_name: productMap[q.productId]?.name || 'Product',
      product_image: productMap[q.productId]?.image || '',
    }));

    return NextResponse.json({ questions: enriched, total, page, limit });
  } catch (err) {
    console.error('Vendor questions GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch vendor questions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    await connectMongo();
    const { questionId, replyText } = await request.json();

    if (!questionId || !replyText?.trim()) {
      return NextResponse.json({ error: 'questionId and replyText are required' }, { status: 400 });
    }

    const question = await Question.findById(questionId);
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    // Verify vendor owns this product
    const supabase = getVendorSupabaseClient();
    const { data: prod } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', question.productId)
      .single();

    if (prod?.vendor_id && prod.vendor_id !== session.vendorId) {
      return NextResponse.json({ error: 'Unauthorized to reply to this question' }, { status: 403 });
    }

    // Replace or add vendor reply
    const existingIdx = question.replies.findIndex(r => r.role === 'vendor');
    if (existingIdx >= 0) {
      question.replies[existingIdx].body = replyText.trim();
      question.replies[existingIdx].createdAt = new Date();
    } else {
      question.replies.push({
        body: replyText.trim(),
        author: session.vendorName || 'Shop',
        role: 'vendor',
        authorId: session.vendorId,
      });
    }
    question.status = 'answered';
    await question.save();

    return NextResponse.json({ success: true, message: 'Answer published!', question });
  } catch (err) {
    console.error('Vendor question POST error:', err);
    return NextResponse.json({ error: 'Failed to post answer' }, { status: 500 });
  }
}
