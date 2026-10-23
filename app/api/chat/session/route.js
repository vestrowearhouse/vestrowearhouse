import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: Load chat history for a session
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Load session status
    const { data: session, error: sessErr } = await supabase
      .from('chat_sessions')
      .select('id, status')
      .eq('session_token', sessionId)
      .single();

    if (sessErr || !session) {
      return NextResponse.json({ messages: [], status: 'ai' });
    }

    // Load history
    const { data: messages, error: msgErr } = await supabase
      .from('chat_messages')
      .select('id, sender, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;

    // Convert keys to standard client format if necessary
    const formattedMessages = (messages || []).map(m => ({
      role: m.sender === 'user' ? 'user' : m.sender === 'ai' ? 'model' : 'admin',
      content: m.content,
      created_at: m.created_at
    }));

    return NextResponse.json({
      messages: formattedMessages,
      status: session.status
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Manage session status updates (e.g. Switch to Human)
export async function POST(request) {
  try {
    const { sessionId, action } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (action === 'talk_to_human') {
      const { data: session, error: sessErr } = await supabase
        .from('chat_sessions')
        .update({ status: 'human', updated_at: new Date().toISOString() })
        .eq('session_token', sessionId)
        .select('id')
        .single();

      if (sessErr || !session) {
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
      }

      // Insert system alert message
      await supabase.from('chat_messages').insert({
        session_id: session.id,
        sender: 'admin',
        content: '[System] Customer requested live agent support.'
      });

      return NextResponse.json({
        success: true,
        status: 'human',
        message: 'Successfully requested live support.'
      });
    } else if (action === 'resolve') {
      const { data: session, error: sessErr } = await supabase
        .from('chat_sessions')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('session_token', sessionId)
        .select('id')
        .single();

      if (sessErr || !session) {
        return NextResponse.json({ error: 'Failed to resolve session' }, { status: 500 });
      }

      // Insert system alert message
      await supabase.from('chat_messages').insert({
        session_id: session.id,
        sender: 'admin',
        content: '[System] Conversation resolved by support agent.'
      });

      return NextResponse.json({
        success: true,
        status: 'closed',
        message: 'Successfully resolved and closed support session.'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
