import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const supabase = getVendorSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page'), 10) || 1;
    const limit = parseInt(searchParams.get('limit'), 10) || 20;

    // We fetch from the new centralized 'notifications' table
    // It has RLS policy: recipient_id = auth.uid() OR recipient_type IN ('all', 'all_vendors')
    // Wait, getVendorSupabaseClient uses the service role key!
    // We should use standard query with the vendorId context.
    const { data: notifications, count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .or(`recipient_id.eq.${session.vendorId},recipient_type.eq.all,recipient_type.eq.all_vendors`)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Get unread count specifically for this vendor
    // Note: Broadcast messages (recipient_id = null) won't have per-user unread tracking with the current schema.
    // For now, we only count specific unread.
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', session.vendorId)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { notificationId, isRead } = await request.json();
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    const supabase = getVendorSupabaseClient();
    
    // Only update if it belongs specifically to the vendor
    const { data: notification } = await supabase
      .from('notifications')
      .select('recipient_id')
      .eq('id', notificationId)
      .single();

    if (notification && notification.recipient_id === session.vendorId) {
      const { data: updated, error } = await supabase
        .from('notifications')
        .update({
          is_read: isRead !== undefined ? isRead : true,
        })
        .eq('id', notificationId)
        .eq('recipient_id', session.vendorId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 400 });
      }
      return NextResponse.json({ notification: updated });
    } else {
      // It's a broadcast message, silently succeed
      return NextResponse.json({ success: true, message: 'Broadcast message treated as read' });
    }
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
