import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

// ── GET /api/products/[id]/questions ────────────────────────
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supabase = getSupabase();

    let query = supabase
      .from('product_questions')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    // If no status param, public sees answered + pending (no rejected)
    if (status === 'all') {
      // Admin view — no filter
    } else if (status) {
      query = query.eq('status', status);
    } else {
      query = query.neq('status', 'rejected');
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ questions: data || [] });
  } catch (error) {
    console.error('GET questions error:', error);
    return NextResponse.json({ questions: [] });
  }
}

// ── POST /api/products/[id]/questions ───────────────────────
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { question, asker_name, user_id } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('product_questions')
      .insert({
        product_id: id,
        user_id: user_id || null,
        question: question.trim(),
        asker_name: asker_name?.trim() || 'Anonymous',
        answer: null,
        answerer: null,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, question: data });
  } catch (error) {
    console.error('POST question error:', error);
    return NextResponse.json({ error: 'Failed to save question' }, { status: 500 });
  }
}
