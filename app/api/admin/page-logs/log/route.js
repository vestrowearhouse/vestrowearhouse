import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// ✅ SECURITY: Simple in-memory rate limiter — 30 logs per minute per IP
const PAGE_LOG_RATE = new Map(); // key: ip -> { count, resetAt }
const PAGE_LOG_LIMIT = 30;
const PAGE_LOG_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip) {
  const now = Date.now();
  if (PAGE_LOG_RATE.size > 100) {
    for (const [k, v] of PAGE_LOG_RATE.entries()) {
      if (now > v.resetAt) PAGE_LOG_RATE.delete(k);
    }
  }
  const record = PAGE_LOG_RATE.get(ip);

  if (!record || now > record.resetAt) {
    PAGE_LOG_RATE.set(ip, { count: 1, resetAt: now + PAGE_LOG_WINDOW_MS });
    return false;
  }

  if (record.count >= PAGE_LOG_LIMIT) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(request) {
  try {
    // ✅ SECURITY: Rate limit by IP to prevent database spam
    const forwardedFor = request.headers.get('x-forwarded-for');
    const user_ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    if (isRateLimited(user_ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { route_path, error_code, details } = body;

    // ✅ SECURITY: Input validation — prevent garbage/spam data
    if (!route_path || typeof route_path !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid route_path' }, { status: 400 });
    }
    if (route_path.length > 500) {
      return NextResponse.json({ success: false, error: 'route_path too long' }, { status: 400 });
    }

    // error_code must be a 3-digit HTTP status code if provided
    if (error_code !== undefined && error_code !== null) {
      const codeNum = parseInt(error_code);
      if (isNaN(codeNum) || codeNum < 100 || codeNum > 599) {
        return NextResponse.json({ success: false, error: 'Invalid error_code' }, { status: 400 });
      }
    }

    // Truncate details to prevent oversized payloads
    const safeDetails = details ? String(details).slice(0, 1000) : null;

    const { error } = await supabase
      .from('page_logs')
      .insert([
        {
          route_path: route_path.slice(0, 500),
          error_code: error_code ? parseInt(error_code) : null,
          user_ip,
          details: safeDetails,
        }
      ]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save page log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
