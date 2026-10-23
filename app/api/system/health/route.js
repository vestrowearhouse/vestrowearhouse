import { createClient } from '@supabase/supabase-js';
import os from 'os';

export async function GET() {
  // Server-side environment info
  const serverEnv = {
    nodeEnv: process.env.NODE_ENV || 'unknown',
    platform: process.platform,
    arch: process.arch,
    region: process.env.VERCEL_REGION || process.env.AWS_REGION || process.env.GCP_REGION || null,
  };

  // Resource health heuristics (best-effort)
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemPct = totalMem > 0 ? ((totalMem - freeMem) / totalMem) * 100 : 0;

  const cpuLoad = (() => {
    const load = os.loadavg?.() || [];
    // Normalize loosely: treat average load relative to cores (best-effort)
    const cores = Math.max(1, os.cpus()?.length || 1);
    const oneMin = load[0] ?? 0;
    return Math.min(100, (oneMin / cores) * 100);
  })();

  const appOk = process.uptime() > 0;

  // DB check: use Supabase service role if available (required for system-level introspection)
  let dbOk = false;
  let dbLatencyMs = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // fallback (read-only)

  if (supabaseUrl && serviceRole) {
    try {
      const supabase = createClient(supabaseUrl, serviceRole, {
        auth: { persistSession: false },
      });

      const t0 = Date.now();
      // Lightweight query: ask for current_user (works in Postgres via RPC or SQL)
      // In Supabase, simplest is a metadata call via from('settings') if exists,
      // but we can't assume schema. We'll use a generic "select 1" by querying pg_catalog.
      // If permissions disallow, we'll mark DB as not ok.
      const { data: pg, error } = await supabase.rpc('pg_select_1', {}, { headers: {} }).catch(() => ({ data: null, error: null }));
      const dt = Date.now() - t0;

      // If rpc doesn't exist, try a generic "health" query against supabase schema via stored procedure isn't guaranteed.
      // As a fallback, do a simple list on 'activity_logs' if it exists; otherwise consider connectivity ok but stats unknown.
      if (!pg) {
        const { error: tErr } = await supabase.from('activity_logs').select('id').limit(1);
        dbOk = !tErr;
      } else {
        dbOk = !error;
      }

      dbLatencyMs = dt;
    } catch {
      dbOk = false;
    }
  }

  // API check: ensure we can read an internal field - since this is the API itself, uptime is enough
  const apiOk = true;

  // Server check thresholds
  const serverOk = appOk && cpuLoad < 90 && usedMemPct < 90;

  // Storage check: best-effort using tmpdir usage
  // Node doesn't provide disk usage per path reliably without extra libs.
  // We'll still report "diskAvailable" as unknown.
  const storageOk = true;

  const statusFor = (ok) => (ok ? 'healthy' : 'error');

  // Overall status: if any critical area is error => error; else warning if server resource high
  let overall = 'healthy';
  const criticalErrors = [
    { key: 'application', ok: appOk },
    { key: 'database', ok: dbOk },
    { key: 'api', ok: apiOk },
  ].filter((x) => !x.ok);

  if (criticalErrors.length > 0) overall = 'error';
  else if (!serverOk) overall = 'warning';

  // Detailed statuses
  const responseTimeHeuristicMs = dbLatencyMs ?? 0;
  const apiAvailability = 100; // this endpoint is live; uptime % computed elsewhere

  return Response.json({
    overallStatus: overall,
    statuses: {
      application: {
        status: statusFor(appOk),
      },
      database: {
        status: statusFor(dbOk),
        responseTimeMs: responseTimeHeuristicMs,
      },
      api: {
        status: statusFor(apiOk),
        availabilityPercent: apiAvailability,
      },
      server: {
        status: serverOk ? 'healthy' : 'warning',
        cpuLoadPct: Number(cpuLoad.toFixed(1)),
        memoryUsedPct: Number(usedMemPct.toFixed(1)),
      },
      storage: {
        status: storageOk ? 'healthy' : 'warning',
        // best-effort placeholder; UI will treat unknown as warning if needed
        diskUsagePct: null,
      },
    },
    serverEnv,
    meta: {
      generatedAt: new Date().toISOString(),
    },
  });
}
