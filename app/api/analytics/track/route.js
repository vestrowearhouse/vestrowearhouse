import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

// Use service role to bypass RLS for inserting analytics silently
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { path, referer, event_type = 'page_view' } = await req.json();
    
    // Extract headers for tracking
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
    
    // Generate an anonymous unique visitor ID (Hash of IP + UserAgent + daily salt to respect privacy but track daily uniques)
    // Using simple hash here so we don't store raw IPs in the analytics table
    const salt = new Date().toISOString().split('T')[0]; // Reset uniques every day
    const visitor_id = crypto.createHash('sha256').update(ip + userAgent + salt).digest('hex').substring(0, 16);

    // Parse User Agent
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const device_type = parser.getDevice().type || 'desktop'; // undefined usually means desktop

    // Insert into Supabase
    const { error } = await supabase
      .from('page_views')
      .insert([
        {
          visitor_id,
          path,
          browser,
          os,
          device_type,
          country,
          referer,
          event_type
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Return 200 anyway so we don't block the client or show errors in console for tracking failures
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
