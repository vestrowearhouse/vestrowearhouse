import { NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import { getAdminSupabase } from '@/lib/dbExplorer';

const BOT_USER_AGENT_REGEX = /bot|crawler|spider|crawling|preview|facebookexternalhit|whatsapp|googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider|headlesschrome|lighthouse|puppeteer|selenium|playwright|webdriver|postman|insomnia|curl|wget|python|httpclient|axios|got|node-fetch/i;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, referer, is_webdriver = false, event_type = 'page_view' } = body;
    
    // 0. Skip Next.js prefetch, RSC, and crawler pre-render requests
    const isPrefetch = 
      req.headers.get('next-router-prefetch') ||
      req.headers.get('purpose') === 'prefetch' ||
      req.headers.get('x-purpose') === 'prefetch' ||
      req.headers.get('rsc');
    if (isPrefetch) {
      return NextResponse.json({ success: true, skipped: 'prefetch' }, { status: 200 });
    }

    // 1. Skip headless automated testing / webdriver
    if (is_webdriver) {
      return NextResponse.json({ success: true, skipped: 'webdriver' }, { status: 200 });
    }

    // 2. Skip admin and API paths
    if (!path || path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ success: true, skipped: 'internal_path' }, { status: 200 });
    }

    // 3. Extract headers and check bot user agent
    const userAgent = req.headers.get('user-agent') || '';
    if (BOT_USER_AGENT_REGEX.test(userAgent)) {
      return NextResponse.json({ success: true, skipped: 'bot_user_agent' }, { status: 200 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const country = req.headers.get('x-vercel-ip-country') || null;
    
    // Generate visitor ID (Hash of IP + UserAgent + daily salt)
    const salt = new Date().toISOString().split('T')[0];
    const visitor_id = crypto.createHash('sha256').update(ip + userAgent + salt).digest('hex').substring(0, 16);

    const supabase = getAdminSupabase();

    // 4. Deduplication: skip identical visitor + path within 30 seconds
    const thirtySecsAgo = new Date(Date.now() - 30000).toISOString();
    const { data: recentHit } = await supabase
      .from('page_views')
      .select('id')
      .eq('visitor_id', visitor_id)
      .eq('path', path)
      .gte('created_at', thirtySecsAgo)
      .limit(1);

    if (recentHit && recentHit.length > 0) {
      return NextResponse.json({ success: true, deduped: true }, { status: 200 });
    }

    // Parse User Agent
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const device_type = parser.getDevice().type || 'desktop';

    const cleanReferrer = referer || null;

    // Insert into Supabase (writes both referer and referrer to maintain full compatibility)
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
          referer: cleanReferrer,
          referrer: cleanReferrer,
          user_agent: userAgent || null,
          event_type
        }
      ]);

    if (error) {
      // If user_agent column doesn't exist yet before SQL migration runs, retry without it
      if (error.message && error.message.includes('user_agent')) {
        await supabase.from('page_views').insert([{
          visitor_id,
          path,
          browser,
          os,
          device_type,
          country,
          referer: cleanReferrer,
          referrer: cleanReferrer,
          event_type
        }]);
      } else {
        throw error;
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
