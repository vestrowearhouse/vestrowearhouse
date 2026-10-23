import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const supabase = getVendorSupabaseClient();
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('vendor_id', session.vendorId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return empty
        return NextResponse.json({ messages: [] });
      }
      throw error;
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    console.error('Vendor support get error:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const body = await request.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = getVendorSupabaseClient();
    
    // Check if table exists by doing a select limit 0. If it fails, we know it's missing but let's just insert
    const insertData = {
      vendor_id: session.vendorId,
      role: 'vendor',
      content: message.trim(),
    };

    const { data, error } = await supabase
      .from('support_messages')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data });
  } catch (err) {
    console.error('Vendor support post error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
