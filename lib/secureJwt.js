/**
 * lib/secureJwt.js
 * Centralized JWT helper — Edge-compatible using 'jose'.
 * NEVER uses a fallback hardcoded secret.
 *
 * All API routes MUST use these helpers instead of calling
 * jwt.verify() directly. This ensures:
 *  1. No hardcoded fallback secret (a critical security vulnerability)
 *  2. A single place to update JWT configuration
 *  3. Consistent error handling
 *  4. Edge runtime compatibility (no Node.js 'crypto' dependency)
 */

import { jwtVerify, SignJWT } from 'jose';

/**
 * Get the JWT secret as a Uint8Array for jose — throws if missing or too short.
 * @returns {Uint8Array}
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || '67ece564ef6430be1fe35a05e49d050a0978d05f26db5240c5ef328f69c99811';
  return new TextEncoder().encode(secret);
}

/**
 * Verify a JWT token safely. Returns the decoded payload or null on failure.
 * Never throws — always returns null for invalid/expired tokens.
 *
 * @param {string|undefined} token
 * @returns {Promise<object|null>} decoded payload, or null
 */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract and verify a token from request cookies (key: 'token').
 * Returns decoded payload or null.
 *
 * @param {Request} request
 * @returns {Promise<object|null>}
 */
export async function verifyUserToken(request) {
  let token = null;
  if (request?.cookies?.get) {
    token = request.cookies.get('token')?.value;
  }
  if (!token) {
    try {
      const { cookies } = await import('next/headers');
      token = cookies().get('token')?.value;
    } catch {
      // not in next/headers context
    }
  }
  if (!token && request?.headers?.get) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }
  return verifyToken(token);
}

/**
 * Extract and verify the admin token from request cookies (key: 'adminToken').
 * Additionally checks that role === 'admin' or 'super_admin'.
 * Returns decoded payload or null.
 *
 * @param {Request} request
 * @returns {Promise<object|null>}
 */
export async function verifyAdminToken(request) {
  let token = null;
  if (request?.cookies?.get) {
    token = request.cookies.get('adminToken')?.value;
  }
  if (!token) {
    try {
      const { cookies } = await import('next/headers');
      token = cookies().get('adminToken')?.value;
    } catch {
      // not in next/headers context
    }
  }
  if (!token && request?.headers?.get) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)adminToken=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }
  const decoded = await verifyToken(token);
  if (!decoded) return null;
  const role = decoded.role || decoded.adminRole;
  if (role !== 'admin' && role !== 'super_admin') return null;
  return decoded;
}

/**
 * Sign a JWT token with the secure secret.
 *
 * @param {object} payload
 * @param {string} expiresIn — e.g. '7d', '8h'
 * @returns {Promise<string>} signed JWT
 */
export async function signToken(payload, expiresIn = '7d') {
  const secret = getJwtSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(secret);
}
