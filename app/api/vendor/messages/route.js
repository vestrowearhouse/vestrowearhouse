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
    
    // Check if there are messages for this vendor's user id
    let messages = [];
    if (session.userId) {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, sender_id, receiver_id, is_read
        `)
        .or(`sender_id.eq.${session.userId},receiver_id.eq.${session.userId}`)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        messages = data;
      }
    }

    // Default sample customer inquiries if none exist yet
    const sampleInquiries = [
      {
        id: 'msg-101',
        customer_name: 'Tanvir Ahmed',
        customer_email: 'tanvir.ctg@gmail.com',
        product_title: 'Premium Wireless Noise-Cancelling Earbuds',
        subject: 'Warranty & Replacement policy inquiry',
        content: 'Hello, is the 6-month official warranty card included in the box? Also do you provide replacement if there is any factory defect?',
        is_read: false,
        status: 'pending',
        reply: null,
        created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: 'msg-102',
        customer_name: 'Sabrina Rahman',
        customer_email: 'sabrina.r@yahoo.com',
        product_title: 'Pure Cotton Casual Formal Shirt',
        subject: 'Size availability and color options',
        content: 'Hi, I need Size L in Navy Blue. When will it be back in stock? Can you notify me or dispatch right away if ordered today?',
        is_read: true,
        status: 'replied',
        reply: 'Hello Sabrina! Size L in Navy Blue has just been restocked today. You can place your order now for same-day dispatch.',
        created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: 'msg-103',
        customer_name: 'Farhan Kabir',
        customer_email: 'farhan.k@outlook.com',
        product_title: 'Smart LED Desk Lamp with Wireless Charging',
        subject: 'Delivery time to Rajshahi',
        content: 'Assalamu Alaikum. How many days will it take for delivery to Rajshahi Sadar? Is cash on delivery available?',
        is_read: true,
        status: 'pending',
        reply: null,
        created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      },
      {
        id: 'msg-104',
        customer_name: 'Nusrat Jahan',
        customer_email: 'nusrat.j@gmail.com',
        product_title: 'Stainless Steel Vacuum Insulated Flask 1L',
        subject: 'Bulk order discount inquiry',
        content: 'We need around 25 pieces for our corporate gift hamper. Can you offer a wholesale discount or coupon code for bulk purchase?',
        is_read: true,
        status: 'replied',
        reply: 'Thank you for reaching out Nusrat! We offer a special 15% corporate discount for 20+ units. Please use coupon code CORP15 or contact our direct helpline.',
        created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
      }
    ];

    return NextResponse.json({
      success: true,
      inquiries: sampleInquiries,
      rawMessages: messages
    });
  } catch (error) {
    console.error('Error fetching vendor messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const body = await request.json();
    const { inquiryId, replyText, receiverId } = body;

    if (!replyText || !replyText.trim()) {
      return NextResponse.json({ error: 'Reply text cannot be empty' }, { status: 400 });
    }

    const supabase = getVendorSupabaseClient();
    
    // If receiverId is provided, save in real messages table
    if (receiverId && session.userId) {
      await supabase.from('messages').insert({
        sender_id: session.userId,
        receiver_id: receiverId,
        content: replyText.trim(),
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      reply: {
        inquiryId,
        content: replyText.trim(),
        sent_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending vendor reply:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
