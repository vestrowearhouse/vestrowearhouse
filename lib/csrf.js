/**
 * lib/csrf.js
 * CSRF Protection — Double-Submit Cookie Pattern (stateless, Edge-compatible).
 *
 * How it works:
 *  1. On any GET page load, a random CSRF token is generated and set in
 *     a readable cookie (`csrf_token`).
 *  2. Client-side JS reads that cookie and includes it in every
 *     state-changing request header (`X-CSRF-Token`).
 *  3. The server validates that the header value matches the cookie value.
 *
 * This is effective against CSRF because attackers cannot read cookies
 * from another origin (same-origin policy), so they cannot forge the header.
 */

import { NextResponse } from 'next/server';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

// Safe methods that don't need CSRF protection
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// API paths that require CSRF validation (state-changing endpoints)
const CSRF_PROTECTED_PATHS = [
  '/api/auth/login',
  '/api/auth/admin-login',
  '/api/auth/admin-logout',
  '/api/vendor/auth',
];

/**
 * Generate a cryptographically secure random token.
 * Uses Web Crypto API (available in both Node.js and Edge runtime).
 */
export function generateCsrfToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate CSRF token from incoming request.
 * Returns { valid: boolean, reason?: string }
 */
export function validateCsrf(request) {
  // Skip safe HTTP methods
  if (SAFE_METHODS.has(request.method)) {
    return { valid: true };
  }

  // Only validate paths in our protected list
  const path = request.nextUrl?.pathname || '';
  const isProtected = CSRF_PROTECTED_PATHS.some((p) => path.startsWith(p));
  if (!isProtected) {
    return { valid: true };
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken) {
    return { valid: false, reason: 'Missing CSRF cookie' };
  }
  if (!headerToken) {
    return { valid: false, reason: 'Missing X-CSRF-Token header' };
  }
  if (!safeCompare(cookieToken, headerToken)) {
    return { valid: false, reason: 'CSRF token mismatch' };
  }

  return { valid: true };
}

/**
 * Set a fresh CSRF cookie on a response.
 * Call this when serving pages (not API responses).
 */
export function setCsrfCookie(response, token) {
  const csrfToken = token || generateCsrfToken();
  response.cookies.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false, // Must be readable by client-side JS
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return csrfToken;
}

/**
 * Middleware helper: validates CSRF and returns a 403 response if invalid.
 * Returns null if valid (caller should continue).
 */
export function csrfMiddleware(request) {
  const { valid, reason } = validateCsrf(request);
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh the page and try again.' },
      { status: 403 }
    );
  }
  return null; // valid — continue
}
