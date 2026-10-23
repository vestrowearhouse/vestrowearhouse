import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAccess, ROLES } from '@/lib/auth';
import { verifyAdminToken } from '@/lib/secureJwt';
import { logActivity } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function authenticate(request) {
  try {
    const auth = await checkAdminAccess([ROLES.SUPER_ADMIN, ROLES.EDITOR]);
    if (auth?.authorized) return auth;
  } catch {}

  try {
    const tokenPayload = await verifyAdminToken(request);
    if (tokenPayload) {
      return { authorized: true, user: tokenPayload, userId: tokenPayload.id || tokenPayload.userId };
    }
  } catch {}

  return { authorized: false };
}

export async function GET(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, phone, role')
      .order('created_at', { ascending: false })
      .limit(300);

    if (usersError) {
      console.warn('Users fetch error in notifications:', usersError);
    }

    // Fetch vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, shop_name, email, phone')
      .order('created_at', { ascending: false })
      .limit(300);

    if (vendorsError) {
      console.warn('Vendors fetch error in notifications:', vendorsError);
    }

    // Fetch history
    const { data: history, error: historyError } = await supabase
      .from('notifications')
      .select('id, title, message, type, recipient_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (historyError) {
      console.warn('Notifications history error:', historyError);
    }

    return NextResponse.json({ 
      users: users || [], 
      vendors: vendors || [],
      history: history || []
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { target_type, target_ids, title, message, type } = body;

    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Missing title, message, or notification type' }, { status: 400 });
    }

    // Safely determine sender UUID
    let sender_id = null;
    const rawUserId = auth.userId || auth.user?.id || auth.user?.userId;
    if (rawUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawUserId))) {
      sender_id = rawUserId;
    }

    let notificationsToInsert = [];

    if (target_type === 'single_user' || target_type === 'single_vendor') {
      if (!target_ids || !Array.isArray(target_ids) || target_ids.length === 0) {
        return NextResponse.json({ error: 'Please select at least one recipient from the directory' }, { status: 400 });
      }
      notificationsToInsert = target_ids.map(id => ({
        sender_id,
        recipient_id: id,
        recipient_type: target_type,
        title: title.trim(),
        message: message.trim(),
        type,
        created_at: new Date().toISOString()
      }));
    } else {
      // Broadcasts
      if (!['all', 'all_users', 'all_vendors'].includes(target_type)) {
        return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
      }
      notificationsToInsert = [{
        sender_id,
        recipient_id: null,
        recipient_type: target_type,
        title: title.trim(),
        message: message.trim(),
        type,
        created_at: new Date().toISOString()
      }];
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationsToInsert)
      .select();

    if (error) {
      console.error('Supabase insert notification error:', error);
      return NextResponse.json({ error: error.message || 'Failed to dispatch notification' }, { status: 400 });
    }

    try {
      await logActivity({
        action: 'SEND_NOTIFICATION',
        description: `Sent notification: "${title}" to ${target_type}`,
        req: request
      });
    } catch {}

    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent successfully',
      count: notificationsToInsert.length,
      data: data?.[0]
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Notification removed from history' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}

