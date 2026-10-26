/**
 * Nightly Database Backup Cron Endpoint
 * Copies Supabase tables into MongoDB collection 'backup_data' and records runs in 'backup_runs'.
 * 
 * Scheduled daily via Vercel Cron at 0 21 * * * (3:00 AM BST / UTC+6).
 * Protected strictly by CRON_SECRET bearer authentication.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMongoDb, getMongoStatus } from '@/lib/mongo';
import { executeBackup, sanitizeErrorMessage } from '@/lib/backup-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel hobby maximum execution limit

export async function GET(request) {
  const startTime = Date.now();

  try {
    // 1. Strict Authentication Check
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('[Backup Cron Error]: CRON_SECRET environment variable is not configured.');
      return NextResponse.json(
        { success: false, error: 'Server authentication configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. MongoDB Status Verification (Never fake success if Mongo is down)
    const mongoStatus = await getMongoStatus();
    if (!mongoStatus.ok) {
      console.error('[Backup Cron Error]: MongoDB is offline or unreachable:', mongoStatus.error);
      return NextResponse.json(
        {
          success: false,
          error: 'MongoDB storage is unavailable. Backup aborted.',
        },
        { status: 500 }
      );
    }

    // 3. Supabase Client Setup (Service Role Key for complete schema read access)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Backup Cron Error]: Supabase connection credentials missing.');
      return NextResponse.json(
        { success: false, error: 'Database source credentials not configured.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 4. Retrieve connected native Mongo Db instance
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Failed to access MongoDB database instance.' },
        { status: 500 }
      );
    }

    // 5. Execute Backup with 50-second safety time budget
    const result = await executeBackup({
      supabase,
      db,
      trigger: 'cron',
      timeBudgetMs: 50000,
    });

    // 6. Return Summary Response (Row data and secrets are never returned)
    return NextResponse.json({
      success: result.success,
      runId: result.runId,
      status: result.status,
      durationMs: result.durationMs,
      approxBytes: result.approxBytes,
      tablesProcessed: result.tablesProcessed,
      tables: result.tables,
    });
  } catch (error) {
    const sanitized = sanitizeErrorMessage(error);
    console.error('[Backup Cron Uncaught Exception]:', sanitized);
    return NextResponse.json(
      {
        success: false,
        error: sanitized || 'Internal backup engine error',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
