import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken, verifyAdminToken } from '@/lib/secureJwt';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request) {
  try {
    // 🔒 SECURITY: Verify the caller is an authenticated user or admin
    const userPayload = await verifyUserToken(request);
    const adminPayload = await verifyAdminToken(request);

    if (!userPayload && !adminPayload) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const callerPayload = adminPayload || userPayload;
    const callerId = callerPayload.id;
    const callerRole = callerPayload.role || callerPayload.adminRole;

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId'); 
    const otherUserId = url.searchParams.get('otherUserId'); 
    const getAdmin = url.searchParams.get('getAdmin');

    const supabase = getSupabaseClient();

    // 1. Auto-delete messages older than 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    await supabase.from('messages').delete().lt('created_at', twoDaysAgo.toISOString());

    // 2. Fetch Admin User if requested (for Vendor Chat UI)
    if (getAdmin === 'true') {
      const { data: adminUser, error: adminErr } = await supabase
        .from('users')
        .select('id, name, role, email')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (adminErr || !adminUser) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      return NextResponse.json({ adminUser });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 🔒 SECURITY: Non-admin users can only access their own messages
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin';
    if (!isAdmin && callerId !== userId) {
      return NextResponse.json({ error: 'Forbidden. You can only access your own messages.' }, { status: 403 });
    }

    // 3. Fetch messages between two specific users
    if (otherUserId) {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, sender_id, receiver_id, is_read,
          sender:users!sender_id (id, name, role, email),
          receiver:users!receiver_id (id, name, role, email)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ messages: data });
    }

    // 4. Fetch all vendors for Admin Sidebar — admin only
    const fetchAllVendors = url.searchParams.get('fetchAllVendors');
    if (fetchAllVendors === 'true') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }
      const { data: vendors, error: vendorErr } = await supabase
        .from('users')
        .select('id, name, role, email')
        .eq('role', 'vendor')
        .order('created_at', { ascending: false });

      if (vendorErr) throw vendorErr;
      
      return NextResponse.json({ vendors });
    }

    // Default return
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 🔒 SECURITY: Verify the caller is an authenticated user
    const userPayload = await verifyUserToken(request);
    const adminPayload = await verifyAdminToken(request);

    if (!userPayload && !adminPayload) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to send messages.' }, { status: 401 });
    }

    const callerPayload = adminPayload || userPayload;
    const callerId = callerPayload.id;
    const callerRole = callerPayload.role || callerPayload.adminRole;

    const { sender_id, receiver_id, content } = await request.json();

    if (!sender_id || !receiver_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 🔒 SECURITY: sender_id must match the authenticated caller (admins can send as themselves)
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin';
    if (!isAdmin && callerId !== sender_id) {
      return NextResponse.json({ error: 'Forbidden. You cannot send messages as another user.' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id, receiver_id, content }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
