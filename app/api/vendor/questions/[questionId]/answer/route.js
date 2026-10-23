import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

// ── PATCH /api/vendor/questions/[questionId]/answer ─────────
// Vendor answers a customer question about their product
export async function PATCH(request, { params }) {
  try {
    const { questionId } = params;
    const body = await request.json();
    const { answer, vendor_name, vendor_id } = body;

    if (!answer?.trim()) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify the question belongs to a product owned by this vendor
    if (vendor_id) {
      const { data: q } = await supabase
        .from('product_questions')
        .select('product_id')
        .eq('id', questionId)
        .single();

      if (q?.product_id) {
        const { data: prod } = await supabase
          .from('products')
          .select('vendor_id')
          .eq('id', q.product_id)
          .single();

        if (prod?.vendor_id && prod.vendor_id !== vendor_id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }
    }

    const { data, error } = await supabase
      .from('product_questions')
      .update({
        answer: answer.trim(),
        answerer: vendor_name || 'Store Official',
        answered_by: 'vendor',
        answered_at: new Date().toISOString(),
        status: 'answered',
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, question: data });
  } catch (error) {
    console.error('Vendor answer question error:', error);
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}
