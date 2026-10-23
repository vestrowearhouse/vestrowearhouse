/**
 * middleware.js
 * Next.js Edge Middleware — runs before every request.
 *
 * Responsibilities:
 *  1. WAF (Firewall)  — Block bots, SQLi, XSS, path traversal, scanners
 *  2. Rate Limiting   — Brute-force protection on auth endpoints
 *  3. CSRF Protection — Token validation for state-changing requests
 *  4. Authentication  — JWT validation for protected routes
 *  5. Analytics       — Async page-view tracking in Supabase
 */

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ═══════════════════════════════════════════════════════════════
// WAF — Web Application Firewall
// ═══════════════════════════════════════════════════════════════

/**
 * Known vulnerability scanner / bad-bot user-agent substrings.
 * These are never real browsers — block them immediately.
 */
const BAD_UA_PATTERNS = [
  // Scanners & exploit tools
  'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'nuclei',
  'wfuzz', 'dirbuster', 'gobuster', 'ffuf', 'feroxbuster',
  'burpsuite', 'burp suite', 'owasp', 'acunetix', 'nessus',
  'openvas', 'metasploit', 'havij', 'hydra', 'medusa',
  'w3af', 'arachni', 'skipfish', 'vega',
  // Generic attack/automation patterns
  // ✅ SECURITY: Block all curl versions (not just 7.x), all go-http-client versions
  'python-requests/', 'go-http-client/', 'libwww-perl',
  'curl/', 'wget/', 'httpclient',
  // ⚠️ Removed 'java/' — too broad, blocks legitimate Java-based mobile apps and integrations
  // Scrapers & aggressive bots
  'scrapy', 'mechanize', 'grabber', 'baiduspider', 'bytespider',
];

/**
 * SQL Injection detection patterns.
 * Targeted specifically at SQL injection syntax rather than natural text with quotes.
 */
const SQLI_PATTERNS = [
  /('|%27|\\x27)\s*(or|and)\s*(\d+=\d+|'[^']*'='[^']*'|[a-z0-9_]+=[a-z0-9_]+)/i,
  /('|%27|\\x27)\s*(union|select|insert|update|delete|drop|create|alter|exec|execute|truncate)\s+/i,
  /(union\s+(all\s+)?select)/i,
  /(select\s+.*\s+from\s+[a-z0-9_]+)/i,
  /(insert\s+into\s+[a-z0-9_]+)/i,
  /(delete\s+from\s+[a-z0-9_]+)/i,
  /(drop\s+(table|database|column|index))/i,
  /(exec(ute)?\s*(\s|\+)*(xp_|sp_))/i,
  /(\/\*.*\*\/|--\s*$|;\s*(drop|delete|truncate|create|alter|exec))/i,
  /(0x[0-9a-f]{6,})/i,                // Hex encoding often used in SQLi
  /(benchmark\s*\(\s*\d+|sleep\s*\(\s*\d+)/i,     // Time-based blind SQLi
  /(information_schema|sysobjects|syscolumns)/i,
];

/**
 * XSS (Cross-Site Scripting) detection patterns.
 * Targeted at executable script injection, not benign apostrophes or double quotes.
 */
const XSS_PATTERNS = [
  /<\s*script[\s>]/i,
  /<\s*\/\s*script\s*>/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /on(load|error|click|mouse|focus|blur|key|submit|change|input|scroll|resize|abort|unload|message|storage|hash|popstate)\s*=/i,
  /(document|window)\.(cookie|location|write|createElement|innerHTML|outerHTML|eval)/i,
  /<\s*(iframe|embed|object|applet|form|base|link|meta|style)[\s>]/i,
  /(%3c|<)\s*(script|iframe|object|embed|svg|img|body|style)/i,
  /(%3c|<)\s*\/\s*(script|iframe|object|embed)/i,
  /expression\s*\(/i,                   // CSS expression
  /data:\s*text\/html/i,                // data: URI XSS
];

/**
 * Path traversal detection patterns.
 */
const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.\/|\.\.\\ |%2e%2e%2f|%2e%2e\\|%252e%252e)/i,
  /(\/etc\/passwd|\/etc\/shadow|\/proc\/self|win\.ini|boot\.ini)/i,
  /(\|cmd\.exe|\|powershell|\|bash|\|sh\s)/i,
];

/**
 * Honeypot paths — real users never hit these.
 * Any request here is almost certainly a scanner.
 */
const HONEYPOT_PATHS = [
  '/admin.php', '/wp-admin', '/wp-login.php', '/wp-config.php',
  '/administrator', '/phpmyadmin', '/phpMyAdmin', '/pma',
  '/.env', '/.git/HEAD', '/.git/config', '/config.php',
  '/server-status', '/server-info', '/actuator', '/actuator/env',
  '/api/v1/admin', '/.aws/credentials', '/web.config', '/xmlrpc.php',
  '/backup.sql', '/dump.sql', '/database.sql', '/db.sql',
  '/shell.php', '/c99.php', '/r57.php', '/webshell.php',
  '/eval-stdin.php', '/cgi-bin/', '/awstats', '/test.php',
];

/**
 * WAF check — returns a 403 response if the request is malicious,
 * or null if the request should be allowed to continue.
 */
function applyWAF(request) {
  const path = request.nextUrl.pathname;
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const query = request.nextUrl.search || '';
  const fullUrl = path + query;

  // ── 1. Honeypot paths ──────────────────────────────────────────
  if (HONEYPOT_PATHS.some(hp => path === hp || path.startsWith(hp))) {
    console.warn(`[WAF] Honeypot hit: ${path}`);
    return wafBlock('Access denied', 403);
  }

  // ── 2. Bad User-Agents (scanners, exploit tools) ───────────────
  if (ua && BAD_UA_PATTERNS.some(pattern => ua.includes(pattern))) {
    console.warn(`[WAF] Bad UA blocked: ${ua.substring(0, 80)}`);
    return wafBlock('Access denied', 403);
  }

  // ── 3. Null-byte injection ─────────────────────────────────────
  if (fullUrl.includes('%00') || fullUrl.includes('\x00')) {
    console.warn(`[WAF] Null byte injection: ${path}`);
    return wafBlock('Access denied', 400);
  }

  // ── 4. Query string too large (>16KB) — likely attack payload ───
  if (query.length > 16384) {
    console.warn(`[WAF] Oversized query string: ${query.length} bytes`);
    return wafBlock('Request too large', 413);
  }

  // Auth & OAuth routes have valid cryptographic tokens/parameters in query strings
  const isAuthOrOAuth =
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/admin-login') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/vendor/auth') ||
    path.startsWith('/__'); // Firebase auth handler rewrite

  // ── 5. SQL Injection detection (skip auth routes to avoid false-positives on tokens) ─
  if (!isAuthOrOAuth && (path.startsWith('/api') || query.length > 0)) {
    const decodedUrl = safeDecodeURI(fullUrl);
    if (SQLI_PATTERNS.some(p => p.test(decodedUrl))) {
      console.warn(`[WAF] SQLi attempt: ${fullUrl.substring(0, 200)}`);
      return wafBlock('Access denied', 403);
    }
  }

  // ── 6. XSS detection (skip auth routes to avoid false-positives on tokens) ────────
  if (!isAuthOrOAuth && query.length > 0) {
    const decodedQuery = safeDecodeURI(query);
    if (XSS_PATTERNS.some(p => p.test(decodedQuery))) {
      console.warn(`[WAF] XSS attempt: ${query.substring(0, 200)}`);
      return wafBlock('Access denied', 403);
    }
  }

  // ── 7. Path traversal ──────────────────────────────────────────
  if (PATH_TRAVERSAL_PATTERNS.some(p => p.test(fullUrl))) {
    console.warn(`[WAF] Path traversal: ${fullUrl.substring(0, 200)}`);
    return wafBlock('Access denied', 403);
  }

  // ── 8. Missing / forged Host header ───────────────────────────
  const host = (request.headers.get('host') || '').toLowerCase();
  const allowedHostKeywords = [
    'stellarmartbd.com',
    'vercel.app',
    'localhost',
    '127.0.0.1',
    'firebaseapp.com',
  ];
  if (host && !allowedHostKeywords.some(h => host.includes(h))) {
    console.warn(`[WAF] Unknown host: ${host}`);
    return wafBlock('Access denied', 403);
  }

  return null; // Request is clean
}

function wafBlock(message, status) {
  return NextResponse.json({ error: message }, { status });
}

function safeDecodeURI(str) {
  try { return decodeURIComponent(str); }
  catch { return str; }
}

// ─────────────────────────────────────────────
// Rate Limiter (in-memory, per Edge instance)
// ─────────────────────────────────────────────
//
// Note: Vercel spins up multiple Edge instances, so this store is per-instance.
// For globally consistent rate limiting, use Upstash Redis. However this
// in-memory approach still provides strong protection against single-IP attacks
// because each Edge instance enforces its own limits.

const MAX_RATE_LIMIT_KEYS = 500;
const rateLimitStore = new Map(); // key -> { count, resetAt, lockedUntil }

function pruneRateLimitStore(now) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt && (!entry.lockedUntil || now > entry.lockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rules: endpoint -> { windowMs, maxRequests, lockMs }
 *  - windowMs:    sliding window duration
 *  - maxRequests: max allowed attempts in the window
 *  - lockMs:      how long to lock after exceeding limit
 */
const RATE_LIMIT_RULES = {
  '/api/auth/login':         { windowMs: 15 * 60 * 1000, maxRequests: 30, lockMs: 5 * 60 * 1000 },
  '/api/auth/admin-login':   { windowMs: 15 * 60 * 1000, maxRequests: 15, lockMs: 5 * 60 * 1000 },
  '/api/auth/register':      { windowMs:  5 * 60 * 1000, maxRequests: 20, lockMs: 5 * 60 * 1000 },
  '/api/auth/forgot-password': { windowMs: 15 * 60 * 1000, maxRequests: 10, lockMs: 15 * 60 * 1000 },
  '/api/auth/reset-password':  { windowMs: 15 * 60 * 1000, maxRequests: 10, lockMs: 15 * 60 * 1000 },
  '/api/auth/verify-otp':    { windowMs: 10 * 60 * 1000, maxRequests: 15, lockMs: 10 * 60 * 1000 },
  // Vendor auth — same limits as user login
  '/api/vendor/auth/login':  { windowMs: 15 * 60 * 1000, maxRequests: 30, lockMs: 5 * 60 * 1000 },
  // Admin endpoints — standard limits
  '/api/admin':              { windowMs: 60 * 1000,       maxRequests: 120, lockMs: 5 * 60 * 1000 },
  '/admin':                  { windowMs: 60 * 1000,       maxRequests: 60, lockMs: 5 * 60 * 1000 },
};

/**
 * Extract the best available client IP from request headers.
 */
function getClientIP(request) {
  // Vercel sets x-forwarded-for; Cloudflare sets cf-connecting-ip
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP.trim();
  return '127.0.0.1';
}

/**
 * Check and update rate limit for the given key and rule.
 * Returns { allowed: boolean, retryAfterSecs?: number }
 */
function checkRateLimit(key, rule) {
  const now = Date.now();

  // Periodically sweep expired entries when the store has over 150 entries
  if (rateLimitStore.size > 150) {
    pruneRateLimitStore(now);
    while (rateLimitStore.size >= MAX_RATE_LIMIT_KEYS) {
      const oldest = rateLimitStore.keys().next().value;
      if (oldest !== undefined) rateLimitStore.delete(oldest);
      else break;
    }
  }

  const entry = rateLimitStore.get(key);

  if (entry) {
    // Check if IP is in lock period
    if (entry.lockedUntil && now < entry.lockedUntil) {
      const retryAfterSecs = Math.ceil((entry.lockedUntil - now) / 1000);
      return { allowed: false, retryAfterSecs };
    }

    // Reset window if expired
    if (now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs, lockedUntil: null });
      return { allowed: true };
    }

    // Increment count
    entry.count += 1;
    if (entry.count > rule.maxRequests) {
      entry.lockedUntil = now + rule.lockMs;
      rateLimitStore.set(key, entry);
      const retryAfterSecs = Math.ceil(rule.lockMs / 1000);
      return { allowed: false, retryAfterSecs };
    }

    rateLimitStore.set(key, entry);
    return { allowed: true };
  }

  // First request from this key
  rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs, lockedUntil: null });
  return { allowed: true };
}

// ─────────────────────────────────────────────
// JWT Secret helper
// ─────────────────────────────────────────────
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // If JWT_SECRET is missing, we cannot verify tokens.
    // We return a dummy secret that will always fail verification.
    return new TextEncoder().encode('__invalid__secret__that__will__always__fail__verification__');
  }
  return new TextEncoder().encode(secret);
}

// ─────────────────────────────────────────────
// Middleware function
// ─────────────────────────────────────────────

export async function middleware(request, event) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const path = request.nextUrl.pathname;
  const method = request.method;

  // ── 0. Canonical domain redirect: stellarmartbd.com -> www.stellarmartbd.com ─
  // Includes explicit charset=utf-8 header & meta tag so Lighthouse audit passes 100%
  if (host === 'stellarmartbd.com') {
    const redirectUrl = new URL(request.url);
    redirectUrl.host = 'www.stellarmartbd.com';
    redirectUrl.protocol = 'https:';

    const htmlBody = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>Redirecting to www.stellarmartbd.com</title><meta http-equiv="refresh" content="0;url=${redirectUrl.toString()}"></head><body>Redirecting to <a href="${redirectUrl.toString()}">${redirectUrl.toString()}</a></body></html>`;

    return new NextResponse(htmlBody, {
      status: 301,
      headers: {
        'Location': redirectUrl.toString(),
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // ── 0.1 Fast Bot & Vulnerability Scanner Drop ─────────────────────────────
  // Immediately drop scrapers/crawlers scanning fake routes (e.g. /wp-admin, /blog, /api/demo)
  // Saves massive SSR compute, edge function invocations, and bandwidth!
  if (
    path.startsWith('/wp-') ||
    path.startsWith('/blog') ||
    path.startsWith('/api/demo') ||
    path.startsWith('/api/generate') ||
    path.endsWith('.php') ||
    path.endsWith('.env')
  ) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
    });
  }

  // ── 1. WAF — firewall checks run first, before anything else ─────────────
  const wafResponse = applyWAF(request);
  if (wafResponse) return wafResponse;

  // ── 2. Rate Limiting ─────────────────────────────────────────────────────
  // Applied to ALL methods for auth/admin endpoints (not just POST)
  const ruleEntry = Object.entries(RATE_LIMIT_RULES).find(([endpoint]) =>
    path.startsWith(endpoint)
  );
  if (ruleEntry) {
    const [endpoint, limits] = ruleEntry;
    const ip = getClientIP(request);
    const rateLimitKey = `${ip}:${endpoint}`;
    const { allowed, retryAfterSecs } = checkRateLimit(rateLimitKey, limits);

    if (!allowed) {
      const minutes = Math.ceil(retryAfterSecs / 60);
      return NextResponse.json(
        {
          error: `অনেকবার চেষ্টা করা হয়েছে। ${minutes} মিনিট পরে আবার চেষ্টা করুন।`,
          retryAfter: retryAfterSecs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSecs),
            'X-RateLimit-Limit': String(limits.maxRequests),
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + retryAfterSecs * 1000) / 1000)),
          },
        }
      );
    }
  }

  // ── 3. CSRF Protection ────────────────────────────────────────────────────
  // Protect sensitive state-changing auth/admin requests (POST, PUT, PATCH, DELETE)
  const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
  const CSRF_PROTECTED_PREFIXES = [
    '/api/auth/login',
    '/api/auth/admin-login',
    '/api/auth/admin-logout',
    '/api/vendor/auth',
  ];
  if (
    !SAFE_METHODS.has(method) &&
    CSRF_PROTECTED_PREFIXES.some((p) => path.startsWith(p))
  ) {
    const cookieToken = request.cookies.get('csrf_token')?.value;
    const headerToken = request.headers.get('x-csrf-token');
    
    // Check same-origin (OWASP standard defense): browsers cannot forge origin in cross-site requests
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const isSameOrigin = origin && host && (
      origin.includes(host) ||
      origin.replace(/^https?:\/\//, '').split('/')[0] === host ||
      origin.includes('stellarmartbd.com') ||
      origin.includes('localhost')
    );

    const isValidToken = cookieToken && headerToken && cookieToken === headerToken;

    if (!isValidToken && !isSameOrigin) {
      return NextResponse.json(
        { error: 'অনুরোধটি যাচাই করা সম্ভব হয়নি। পেইজটি রিফ্রেশ করে আবার চেষ্টা করুন।' },
        { status: 403 }
      );
    }
  }

  // ── 4. Analytics (async — non-blocking, production & real users only) ─────────
  if (
    process.env.NODE_ENV === 'production' &&
    !path.startsWith('/api') &&
    !path.startsWith('/admin') &&
    !path.includes('.')
  ) {
    event.waitUntil(
      (async () => {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            const userAgent = request.headers.get('user-agent') || '';
            // Skip automated web crawlers and bot hits from bloating Supabase
            if (/bot|crawler|spider|crawling|preview|facebookexternalhit|whatsapp|googlebot|bingbot/i.test(userAgent)) {
              return;
            }

            let device_type = 'desktop';
            if (/mobile/i.test(userAgent)) device_type = 'mobile';
            else if (/tablet/i.test(userAgent)) device_type = 'tablet';

            let browser = 'Unknown';
            if (/chrome/i.test(userAgent)) browser = 'Chrome';
            else if (/safari/i.test(userAgent)) browser = 'Safari';
            else if (/firefox/i.test(userAgent)) browser = 'Firefox';
            else if (/edge/i.test(userAgent)) browser = 'Edge';

            let os = 'Unknown';
            if (/windows/i.test(userAgent)) os = 'Windows';
            else if (/mac/i.test(userAgent)) os = 'MacOS';
            else if (/linux/i.test(userAgent)) os = 'Linux';
            else if (/android/i.test(userAgent)) os = 'Android';
            else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

            const ip = getClientIP(request);
            const visitor_id = Array.from(
              new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + userAgent)))
            )
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .substring(0, 32);

            await fetch(`${supabaseUrl}/rest/v1/page_views`, {
              method: 'POST',
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal',
              },
              body: JSON.stringify({
                path,
                visitor_id,
                device_type,
                browser,
                os,
                event_type: 'page_view',
                referrer: request.headers.get('referer') || null,
              }),
            });
          }
        } catch {
          // Silent catch — analytics must never block requests
        }
      })()
    );
  }

  // ── 5. Public paths (no auth required) ────────────────────────────────────────────
  const publicPaths = [
    '/',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/admin-login',
    '/api/auth/admin-logout',
    '/api/auth/admin-me',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/verify-otp',
    '/api/auth/resend-verification',
    '/api/auth/google-login',
    '/api/products',
    '/api/categories',
    '/api/banners',
    '/api/home',
    '/api/seo',
    '/login',
    '/register',
    '/admin-login',
    '/forgot-password',
  ];

  if (path === '/') return withCsrf(NextResponse.next(), request);

  const isPublicPath = publicPaths.some(
    (p) => path === p || path.startsWith(p + '/')
  );
  if (isPublicPath) return withCsrf(NextResponse.next(), request);

  // ── 6. Admin routes — require admin token ──────────────────────────────────────────
  if (path.startsWith('/admin')) {
    const adminToken = request.cookies.get('adminToken')?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
    try {
      const secret = getJwtSecret();
      const { payload } = await jwtVerify(adminToken, secret);
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  // ── 5. Vendor routes — require vendor token ────────────────────────────────
  if (path.startsWith('/vendor/')) {
    const vendorToken = request.cookies.get('vendorToken')?.value;
    if (!vendorToken) {
      return NextResponse.redirect(new URL('/vendor', request.url));
    }
    try {
      const secret = getJwtSecret();
      await jwtVerify(vendorToken, secret);
    } catch {
      return NextResponse.redirect(new URL('/vendor', request.url));
    }
  }

  return withCsrf(NextResponse.next(), request);
}

// ─────────────────────────────────────────────
// CSRF Cookie Injection Helper
// ─────────────────────────────────────────────
function withCsrf(response, request) {
  // Ensure HTML responses carry charset=utf-8 for Lighthouse and web standards
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html') && !request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Content-Type', 'text/html; charset=utf-8');
  }

  // Only set on GET requests if cookie doesn't already exist
  if (request.method === 'GET' && !request.cookies.has('csrf_token')) {
    // Generate a new random token using Edge-compatible Web Crypto
    const token = crypto.randomUUID().replace(/-/g, '');
    response.cookies.set('csrf_token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Must be lax to allow cross-site navigation to login pages
      httpOnly: false  // Must be false so client-side JS can read it
    });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Skip all static assets, media, fonts, and icons from middleware execution
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|webmanifest)$).*)',
  ],
};
