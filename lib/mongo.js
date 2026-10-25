/**
 * Shared Mongo Foundation for Stellar Mart BD
 * Reuses existing mongoose connection pool from @/lib/mongodb
 * Fire-and-forget safe inserts, IP hashing, and health check utilities.
 */
import crypto from 'crypto';
import connectMongo from '@/lib/mongodb';

export const MONGO_COLLECTIONS = {
  PAGE_VIEWS: 'page_views',
  EVENTS: 'events',
  HEALTH_CHECKS: 'health_checks',
  BACKUP_RUNS: 'backup_runs',
  CACHE_EVENTS: 'cache_events',
  WEBSITE_LOGS: 'website_logs',
  PAGE_LOGS: 'page_logs', // Legacy
  ACTIVITY_LOGS: 'activity_logs',
  REVIEWS: 'reviews',
  QUESTIONS: 'questions',
};

/**
 * Returns the underlying native MongoDB Db instance from the shared mongoose connection.
 */
export async function getMongoDb() {
  const mongooseInstance = await connectMongo();
  if (!mongooseInstance?.connection?.db) {
    throw new Error('MongoDB connection is not established');
  }
  return mongooseInstance.connection.db;
}

/**
 * Hash an IP address with SHA-256 + IP_HASH_SALT.
 * If IP_HASH_SALT is not set, returns null (never fallbacks to raw IP or default salt).
 * Full raw IP is NEVER stored.
 */
export function hashIp(ip) {
  if (!ip || ip === 'unknown') return null;
  const salt = process.env.IP_HASH_SALT;
  if (!salt) return null;
  const cleanIp = String(ip).split(',')[0].trim().replace(/^::ffff:/, '');
  return crypto.createHash('sha256').update(`${cleanIp}:${salt}`).digest('hex');
}

/**
 * Ping MongoDB and return latency & status.
 * Used by admin pages to prevent showing misleading "0" data when Mongo is disconnected.
 */
export async function getMongoStatus() {
  if (!process.env.MONGODB_URI) {
    return { ok: false, latencyMs: null, error: 'MONGODB_URI is not set' };
  }

  const start = Date.now();
  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs, error: null };
  } catch (error) {
    return {
      ok: false,
      latencyMs: null,
      error: error?.message || 'Failed to ping MongoDB',
    };
  }
}

/**
 * Safe insert with max 1500ms timeout.
 * Returns a promise that completes in <= 1500ms (Promise.race timeout).
 * NEVER throws or fails the caller. If Mongo is slow or down, skips quietly with a console.warn.
 */
export async function safeInsert(collectionName, doc) {
  const insertTask = async () => {
    if (!process.env.MONGODB_URI) {
      console.warn(`[Mongo safeInsert] MONGODB_URI not configured. Skipped insert into ${collectionName}`);
      return { success: false, error: 'MONGODB_URI not configured' };
    }

    const db = await getMongoDb();
    const now = new Date();
    const documentToInsert = {
      ...doc,
      timestamp: doc.timestamp instanceof Date ? doc.timestamp : (doc.timestamp ? new Date(doc.timestamp) : now),
      createdAt: doc.createdAt instanceof Date ? doc.createdAt : now,
    };

    const res = await db.collection(collectionName).insertOne(documentToInsert);
    return { success: true, id: res.insertedId };
  };

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => {
      console.warn(`[Mongo safeInsert] Operation timed out (1500ms limit) inserting into ${collectionName}`);
      resolve({ success: false, error: 'Insert timed out (1500ms)' });
    }, 1500)
  );

  try {
    return await Promise.race([insertTask(), timeoutPromise]);
  } catch (error) {
    console.warn(`[Mongo safeInsert] Failed to insert into ${collectionName}:`, error?.message || error);
    return { success: false, error: error?.message || 'Insert error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Specialized Safe-Insert Helpers matching exact required document shapes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a page view
 * Shape: visitorId, isBot, source/utm, country, path, referrer, ipHash, device, browser, timestamp, sessionId?, duration?
 */
export async function recordPageView({
  visitorId,
  isBot = false,
  source = null,
  utm = null,
  country = null,
  path,
  referrer = null,
  ip = null,
  ipHash = null,
  device = 'desktop',
  browser = 'unknown',
  sessionId = null,
  duration = null,
}) {
  const resolvedIpHash = ipHash || hashIp(ip);
  return safeInsert(MONGO_COLLECTIONS.PAGE_VIEWS, {
    visitorId: visitorId || 'anonymous',
    isBot: Boolean(isBot),
    source,
    utm,
    country,
    path: path || '/',
    referrer,
    ipHash: resolvedIpHash,
    device,
    browser,
    sessionId,
    duration,
  });
}

/**
 * Record an e-commerce funnel event
 * Shape: visitorId, type ('add_to_cart' | 'begin_checkout' | 'purchase'), productId, orderId, value, timestamp
 */
export async function recordEvent({
  visitorId,
  type,
  productId = null,
  orderId = null,
  value = 0,
}) {
  return safeInsert(MONGO_COLLECTIONS.EVENTS, {
    visitorId: visitorId || 'anonymous',
    type, // 'add_to_cart' | 'begin_checkout' | 'purchase'
    productId: productId ? String(productId) : null,
    orderId: orderId ? String(orderId) : null,
    value: Number(value) || 0,
  });
}

/**
 * Record system health check
 * Shape: status, supabase { ok, latencyMs }, mongo { ok, latencyMs }, homepageResponseMs, timestamp
 */
export async function recordHealthCheck({
  status = 'healthy',
  supabase = { ok: true, latencyMs: 0 },
  mongo = { ok: true, latencyMs: 0 },
  homepageResponseMs = 0,
}) {
  return safeInsert(MONGO_COLLECTIONS.HEALTH_CHECKS, {
    status,
    supabase,
    mongo,
    homepageResponseMs,
  });
}

/**
 * Record backup run
 * Shape: kind, status, startedAt, finishedAt, durationMs, tableCounts { [table]: { supabase, mongo } }, error
 */
export async function recordBackupRun({
  kind = 'snapshot',
  status = 'completed',
  startedAt,
  finishedAt,
  durationMs = 0,
  tableCounts = {},
  error = null,
}) {
  return safeInsert(MONGO_COLLECTIONS.BACKUP_RUNS, {
    kind,
    status,
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    finishedAt: finishedAt ? new Date(finishedAt) : new Date(),
    durationMs,
    tableCounts,
    error,
  });
}

/**
 * Record cache purge event
 * Shape: scope ('all' | 'homepage'), actor, timestamp, result
 */
export async function recordCachePurge({
  scope = 'all',
  actor = 'admin',
  result = 'success',
}) {
  return safeInsert(MONGO_COLLECTIONS.CACHE_EVENTS, {
    scope,
    actor,
    result,
  });
}

/**
 * Record a 404 / 500 error in existing website_logs collection
 * Shape: path, status, message, level: 'error', source, stack, ipHash, timestamp
 */
export async function recordWebsiteError({
  path,
  status = 500,
  message,
  source = 'web',
  stack = null,
  ip = null,
  meta = null,
}) {
  return safeInsert(MONGO_COLLECTIONS.WEBSITE_LOGS, {
    level: status >= 500 ? 'error' : 'warn',
    path,
    status,
    message,
    source,
    stack,
    ipHash: hashIp(ip),
    meta,
  });
}

export default {
  getMongoDb,
  getMongoStatus,
  hashIp,
  safeInsert,
  recordPageView,
  recordEvent,
  recordHealthCheck,
  recordBackupRun,
  recordCachePurge,
  recordWebsiteError,
  MONGO_COLLECTIONS,
};
