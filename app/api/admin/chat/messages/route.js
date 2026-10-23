import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);



export async function POST(request) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { sessionId, content } = await request.json();

    if (!sessionId || !content || content.trim() === '') {
      return NextResponse.json({ error: 'Session ID and message content are required' }, { status: 400 });
    }

    // Insert admin message
    const { data: msg, error: msgErr } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'admin',
        content: content.trim()
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // Update session update time
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return NextResponse.json({ success: true, message: msg });
  } catch (err) {
    console.error('Admin reply send error:', err);
    return NextResponse.json({ error: 'Failed to send message: ' + err.message }, { status: 500 });
  }
}