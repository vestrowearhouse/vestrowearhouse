import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

/**
 * Inbound Email Webhook
 * Receives incoming emails from email forwarding services, Cloudflare Email Routing,
 * Resend Inbound, or webhook bridges, and saves them to the Admin Webmail Inbox.
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload = {};

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value;
      });
    } else {
      payload = await request.json().catch(() => ({}));
    }

    // Extract sender, subject, and message across various webhook payload standards
    const senderEmail = 
      payload.from || 
      payload.sender || 
      payload.sender_email || 
      payload.envelope?.from || 
      payload.headers?.from ||
      payload.From || 
      '';

    const senderName = 
      payload.from_name || 
      payload.sender_name || 
      payload.FromName || 
      (senderEmail ? senderEmail.split('@')[0] : 'Customer');

    const subject = 
      payload.subject || 
      payload.Subject || 
      payload.headers?.subject || 
      'Incoming Message via Webmail';

    const messageText = 
      payload.text || 
      payload.stripped_text || 
      payload.body || 
      payload.message || 
      payload.html || 
      payload.HtmlBody || 
      payload.TextBody || 
      '';

    if (!senderEmail && !messageText) {
      return NextResponse.json({ error: 'Missing email content or sender.' }, { status: 400 });
    }

    const cleanSender = String(senderEmail).replace(/.*<([^>]+)>.*/, '$1').trim();
    const cleanMessage = typeof messageText === 'string' 
      ? messageText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() 
      : String(messageText);

    const supabase = getSupabase();
    let savedId = null;

    // 1. Try inserting into contact_messages table if present
    try {
      const { data: dbData } = await supabase
        .from('contact_messages')
        .insert([{
          name: senderName.trim(),
          email: cleanSender || 'unknown@customer.com',
          phone: payload.phone || null,
          subject: subject.trim(),
          message: cleanMessage || 'No message body provided.',
          status: 'unread',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbData?.id) savedId = dbData.id;
    } catch (e) {}

    // 2. Also save to resilient system-inbox storage in Supabase
    if (!savedId) {
      const uniqueSlug = `system-inbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const messageDetails = {
        name: senderName.trim(),
        email: cleanSender || 'unknown@customer.com',
        phone: payload.phone || null,
        subject: subject.trim(),
        message: cleanMessage || 'No message body provided.',
        status: 'unread'
      };

      const { data: catData, error: catError } = await supabase
        .from('categories')
        .insert([{
          name: senderName.trim().slice(0, 80),
          slug: uniqueSlug,
          description: subject.trim().slice(0, 150),
          custom_code: JSON.stringify(messageDetails),
          status: 'active',
          icon: '📧',
          sort_order: 0
        }])
        .select()
        .single();

      if (catError) {
        console.error('System inbox insert error:', catError);
        throw new Error('Failed to persist inbound email message');
      }

      if (catData?.id) savedId = catData.id;
    }

    return NextResponse.json({
      success: true,
      message: 'Inbound email received and saved to Admin Webmail Inbox.',
      id: savedId
    }, { status: 201 });

  } catch (err) {
    console.error('Inbound email webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed.' }, { status: 500 });
  }
}
