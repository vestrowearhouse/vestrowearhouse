/**
 * Logger utility — writes to MongoDB (ActivityLog, WebsiteLog)
 * Replaces Supabase activity_logs table
 */
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectMongo from '@/lib/mongodb';
import { ActivityLog, WebsiteLog } from '@/lib/models';

// ── Extract caller info from request ────────────────────────────────────────
async function getCallerInfo(req) {
  let actorId = null;
  let actorEmail = 'System API';
  let actorRole = 'system';
  let ip = 'unknown';
  let userAgent = 'unknown';

  if (req?.headers) {
    ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
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

  return { actorId, actorEmail, actorRole, ip, userAgent };
}

// ── logActivity — write an admin/vendor action to ActivityLog ─────────────
export async function logActivity({ action, description, resource, resourceId, details, req, level = 'info' }) {
  try {
    await connectMongo();
    const caller = await getCallerInfo(req);

    await ActivityLog.create({
      actorId: caller.actorId,
      actorEmail: caller.actorEmail,
      actorRole: caller.actorRole,
      action,
      resource,
      resourceId,
      details: details || { description },
      ip: caller.ip,
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