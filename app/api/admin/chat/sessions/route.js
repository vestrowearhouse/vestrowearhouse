import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);



export async function GET(request) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Fetch sessions
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        session_token,
        session_type,
        status,
        created_at,
        updated_at,
        user_id
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Enrich with user name/email if user_id is set
    const userSessions = sessions.filter(s => s.session_type !== 'vendor' && s.user_id);
    const vendorSessions = sessions.filter(s => s.session_type === 'vendor' && s.user_id);
    
    const userIds = [...new Set(userSessions.map(s => s.user_id))];
    const vendorIds = [...new Set(vendorSessions.map(s => s.user_id))];
    
    let userMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
      (users || []).forEach(u => {
        userMap[u.id] = u;
      });
    }

    let vendorMap = {};
    if (vendorIds.length > 0) {
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, shop_name, owner_name, email, shop_email')
        .in('id', vendorIds);
        
      (vendors || []).forEach(v => {
        vendorMap[v.id] = {
          id: v.id,
          name: v.shop_name || v.owner_name || 'Vendor',
          email: v.email || v.shop_email || ''
        };
      });
    }

    // Load last message snippet for each session
    const sessionsWithSnippets = [];
    for (const sess of (sessions || [])) {
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('content, sender, created_at')
        .eq('session_id', sess.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let userInfo = null;
      if (sess.user_id) {
        if (sess.session_type === 'vendor') {
          userInfo = vendorMap[sess.user_id] || null;
        } else {
          userInfo = userMap[sess.user_id] || null;
        }
      }

      sessionsWithSnippets.push({
        ...sess,
        user: userInfo,
        lastMessage: lastMsg && lastMsg.length > 0 ? lastMsg[0] : null
      });
    }

    return NextResponse.json({ sessions: sessionsWithSnippets });
  } catch (err) {
    console.error('Admin fetch chat sessions error:', err);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}