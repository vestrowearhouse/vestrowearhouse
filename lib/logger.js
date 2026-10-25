/**
 * Logger utility — writes to MongoDB (ActivityLog, WebsiteLog)
 * Replaces Supabase activity_logs table
 */
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectMongo from '@/lib/mongodb';
import { ActivityLog, WebsiteLog } from '@/lib/models';
import { hashIp } from '@/lib/mongo';

// ── Extract caller info from request ────────────────────────────────────────
async function getCallerInfo(req) {
  let actorId = null;
  let actorEmail = 'System API';
  let actorRole = 'system';
  let ipHash = null;
  let userAgent = 'unknown';

  if (req?.headers) {
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null;
    ipHash = hashIp(rawIp);
    userAgent = req.headers.get('user-agent') || 'unknown';
  }

  // Try to decode admin token
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (adminToken) {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const { payload } = await jwtVerify(adminToken, new TextEncoder().encode(secret));
        actorId = payload.id || null;
        actorEmail = payload.email || 'Admin';
        actorRole = 'admin';
      }
    }
  } catch (_) {}

  return { actorId, actorEmail, actorRole, ipHash, userAgent };
}

const SENSITIVE_WORDS = new Set([
  'password',
  'passwd',
  'pwd',
  'hash',
  'token',
  'otp',
  'secret',
  'cookie',
  'cvv',
  'pin',
  'authorization',
  'apikey',
  'credential',
  'credentials',
]);

const KEY_PREFIXES = new Set(['api', 'secret', 'private', 'access', 'service', 'encryption']);
const CARD_SUFFIXES = new Set(['number', 'no', 'num']);

/**
 * Check if a key name represents sensitive information.
 * Splits camelCase, snake_case, kebab-case, dot-notation into individual words.
 * Redacts if any word exactly matches SENSITIVE_WORDS,
 * or matches compound patterns:
 *  - ("api"|"secret"|"private"|"access"|"service"|"encryption") + "key"
 *  - "card" + ("number"|"no"|"num")
 * Does NOT do substring matching.
 */
export function isSensitiveKey(key) {
  if (typeof key !== 'string') return false;

  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\.]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    // 1. Exact single-word match
    if (SENSITIVE_WORDS.has(w)) {
      return true;
    }

    // 2. Compound: ("api"|"secret"|"private"|"access"|"service"|"encryption") + "key"
    if (w === 'key' && i > 0 && KEY_PREFIXES.has(words[i - 1])) {
      return true;
    }

    // 3. Compound: "card" + ("number"|"no"|"num")
    if (w === 'card' && i + 1 < words.length && CARD_SUFFIXES.has(words[i + 1])) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively sanitize details payload:
 * - Depth max 4
 * - Mask keys matching isSensitiveKey as '[redacted]'
 * - Truncate strings > 500 chars
 * - Truncate arrays > 20 items
 */
export function sanitizeDetails(val, depth = 0) {
  if (depth > 4) return '[Max Depth Exceeded]';
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    if (val.length > 500) {
      return val.slice(0, 500) + '... [truncated]';
    }
    return val;
  }

  if (typeof val === 'number' || typeof val === 'boolean') {
    return val;
  }

  if (Array.isArray(val)) {
    const maxItems = 20;
    const truncated = val.slice(0, maxItems).map((item) => sanitizeDetails(item, depth + 1));
    if (val.length > maxItems) {
      truncated.push(`... [${val.length - maxItems} items truncated]`);
    }
    return truncated;
  }

  if (typeof val === 'object') {
    const sanitizedObj = {};
    for (const [k, v] of Object.entries(val)) {
      if (isSensitiveKey(k)) {
        sanitizedObj[k] = '[redacted]';
      } else {
        sanitizedObj[k] = sanitizeDetails(v, depth + 1);
      }
    }
    return sanitizedObj;
  }

  return String(val);
}

// ── logActivity — write an admin/vendor action to ActivityLog ─────────────
export async function logActivity({ action, description, resource, resourceId, details, req, level = 'info' }) {
  try {
    await connectMongo();
    const caller = await getCallerInfo(req);
    const sanitized = sanitizeDetails(details || (description ? { description } : {}));

    await ActivityLog.create({
      actorId: caller.actorId,
      actorEmail: caller.actorEmail,
      actorRole: caller.actorRole,
      action,
      resource,
      resourceId,
      details: sanitized,
      ipHash: caller.ipHash,
      userAgent: caller.userAgent,
      level,
    });
  } catch (error) {
    console.error('ActivityLog write error:', error);
  }
}

// ── logError — write a server error to WebsiteLog ────────────────────────
export async function logError({ message, source, stack, userId, meta }) {
  try {
    await connectMongo();
    await WebsiteLog.create({ level: 'error', message, source, stack, userId, meta });
  } catch (e) {
    console.error('WebsiteLog write error:', e);
  }
}

// ── logInfo — write a general info message to WebsiteLog ─────────────────
export async function logInfo({ message, source, userId, meta }) {
  try {
    await connectMongo();
    await WebsiteLog.create({ level: 'info', message, source, userId, meta });
  } catch (e) {
    console.error('WebsiteLog write error:', e);
  }
}

// ── Legacy compat: keep named export ─────────────────────────────────────
export { logActivity as default };