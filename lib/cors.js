/**
 * lib/cors.js
 * CORS (Cross-Origin Resource Sharing) policy configuration.
 * Only trusted origins can access the API.
 */

import { NextResponse } from 'next/server';

// ─────────────────────────────────────────────
// Allowed Origins Whitelist
// ─────────────────────────────────────────────

const PRODUCTION_ORIGINS = [
  'https://stellarmartbd.com',
  'https://www.stellarmartbd.com',
  'https://stellarmartbd.vercel.app',
];

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
];

function getAllowedOrigins() {
  if (process.env.NODE_ENV === 'development') {
    return [...PRODUCTION_ORIGINS, ...DEV_ORIGINS];
  }
  // Allow extra origins from env (comma-separated)
  const extra = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];
  return [...PRODUCTION_ORIGINS, ...extra];
}

// ─────────────────────────────────────────────
// CORS Headers
// ─────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
  'Access-Control-Max-Age': '86400', // 24h preflight cache
  'Access-Control-Allow-Credentials': 'true',
  // Vary: Origin tells caches that the response differs by Origin header
  // — prevents serving a cached response with wrong CORS headers
  'Vary': 'Origin',
};

/**
 * Get the validated Allow-Origin header value.
 * Returns the matched origin or null if not allowed.
 */
export function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) return null;
  const allowed = getAllowedOrigins();
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

/**
 * Apply CORS headers to a Response object.
 * Call from API route handlers.
 *
 * @param {Response}   response       — the response to modify
 * @param {string|null} allowedOrigin — from getAllowedOrigin()
 * @returns {Response}
 */
export function applyCorsHeaders(response, allowedOrigin) {
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Handle OPTIONS preflight request.
 * Call at the top of API route handlers.
 *
 * @param {Request} request
 * @returns {Response|null} — Response if OPTIONS, null otherwise
 */
export function handleCors(request) {
  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  // Always handle OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    }
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  return null; // Not a preflight — caller should proceed
}

/**
 * Wrap a Next.js API response with CORS headers.
 * Convenience function for API routes.
 *
 * Usage:
 *   const res = NextResponse.json({ ... });
 *   return withCors(request, res);
 */
export function withCors(request, response) {
  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  return applyCorsHeaders(response, allowedOrigin);
}
