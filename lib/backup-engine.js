/**
 * Nightly Backup Engine Core Logic (Supabase -> MongoDB)
 * Exports pure functions for testability and executeBackup() orchestration.
 */

import { BACKUP_TABLES } from './backup-tables';

export const CHUNK_SIZE = 500;
export const PAGE_SIZE = 1000;
export const MAX_BACKUP_BYTES = 100 * 1024 * 1024; // 100 MB safety limit
export const RETENTION_RUNS_COUNT = 14; // Keep latest 14 successful backups

/**
 * Split an array of rows into chunks of maxRowsPerChunk (default: 500).
 * Kept well under MongoDB 16MB document size limit.
 */
export function chunkRows(rows, maxRowsPerChunk = CHUNK_SIZE) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < rows.length; i += maxRowsPerChunk) {
    chunks.push(rows.slice(i, i + maxRowsPerChunk));
  }
  return chunks;
}

/**
 * Estimate UTF-8 byte size of JSON-serialized data.
 */
export function calculateApproxBytes(data) {
  if (!data) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  } catch {
    return 0;
  }
}

/**
 * Compare expected exact count vs actual fetched count.
 */
export function evaluateTableCount(expectedCount, fetchedCount) {
  const expected = typeof expectedCount === 'number' ? expectedCount : 0;
  const saved = typeof fetchedCount === 'number' ? fetchedCount : 0;
  return {
    ok: expected === saved,
    expected,
    saved,
  };
}

/**
 * Determine which older runs should be pruned.
 * Takes an array of successful run IDs ordered from newest to oldest.
 * Returns IDs beyond the retention limit.
 */
export function findRunsToPrune(successfulRunIds, retentionLimit = RETENTION_RUNS_COUNT) {
  if (!Array.isArray(successfulRunIds) || successfulRunIds.length <= retentionLimit) {
    return [];
  }
  return successfulRunIds.slice(retentionLimit);
}

/**
 * Check if the accumulated bytes exceed the 100MB Atlas M0 threshold.
 */
export function isSizeExceeded(currentBytes, maxBytes = MAX_BACKUP_BYTES) {
  return typeof currentBytes === 'number' && currentBytes > maxBytes;
}

/**
 * Sanitize error message to ensure no database credentials, URLs, or tokens leak.
 */
export function sanitizeErrorMessage(error) {
  if (!error) return null;
  const msg = typeof error === 'string' ? error : (error.message || String(error));
  return msg
    .replace(/(Bearer\s+)[A-Za-z0-9\-_\.]+/gi, '$1[REDACTED]')
    .replace(/(mongodb(\+srv)?:\/\/[^:]+:)[^@]+(@)/gi, '$1[REDACTED]$3')
    .replace(/([a-zA-Z0-9_\-\.]+)=([^&;\s]+)/g, (match, key, val) => {
      if (/secret|token|password|key|auth/i.test(key)) {
        return `${key}=[REDACTED]`;
      }
      return match;
    })
    .slice(0, 500);
}

/**
 * Orchestrate the backup from Supabase to MongoDB
 */
export async function executeBackup({
  supabase,
  db,
  trigger = 'cron',
  timeBudgetMs = 50000, // 50 seconds
  tables = BACKUP_TABLES,
}) {
  const startTime = Date.now();
  const runId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const backupRunsCol = db.collection('backup_runs');
  const backupDataCol = db.collection('backup_data');

  // 1. Initialise run record with 'running' status
  await backupRunsCol.insertOne({
    runId,
    trigger,
    startedAt: new Date(startTime),
    finishedAt: null,
    status: 'running',
    tables: [],
    approxBytes: 0,
    error: null,
    createdAt: new Date(startTime),
  });

  const tableResults = [];
  let totalAccumulatedBytes = 0;
  let hasFailures = false;
  let wasAbortedDueToTimeout = false;
  let fatalError = null;

  try {
    // 2. Pre-check database storage size
    try {
      const stats = await db.command({ dbStats: 1 });
      const currentStorageBytes = (stats && (stats.dataSize || stats.storageSize)) || 0;
      if (isSizeExceeded(currentStorageBytes)) {
        throw new Error(`Size guard exceeded: Current MongoDB storage (${Math.round(currentStorageBytes / (1024 * 1024))}MB) exceeds 100MB threshold.`);
      }
    } catch (e) {
      if (e.message && e.message.includes('Size guard')) throw e;
      // If dbStats command fails due to privileges, proceed with byte tracking
    }

    // 3. Process each table
    for (let i = 0; i < tables.length; i++) {
      const tableDef = tables[i];
      const tableName = tableDef.name;
      const pk = tableDef.pk || 'id';

      // Check time budget
      if (Date.now() - startTime > timeBudgetMs) {
        wasAbortedDueToTimeout = true;
        tableResults.push({
          name: tableName,
          expected: 0,
          saved: 0,
          ok: false,
          skipped: true,
          reason: 'Time budget limit reached (50s)',
        });
        continue;
      }

      try {
        // A. Get exact count
        const { count, error: countErr } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countErr) {
          hasFailures = true;
          tableResults.push({
            name: tableName,
            expected: 0,
            saved: 0,
            ok: false,
            error: sanitizeErrorMessage(countErr),
          });
          continue;
        }

        const expectedCount = count || 0;
        const allRows = [];
        let from = 0;
        let tableFetchError = null;

        // B. Fetch rows in pages of 1000
        while (from < expectedCount) {
          if (Date.now() - startTime > timeBudgetMs) {
            wasAbortedDueToTimeout = true;
            break;
          }

          const to = from + PAGE_SIZE - 1;
          const { data, error: pageErr } = await supabase
            .from(tableName)
            .select('*')
            .order(pk, { ascending: true })
            .range(from, to);

          if (pageErr) {
            tableFetchError = pageErr;
            break;
          }

          if (!data || data.length === 0) break;
          allRows.push(...data);
          from += data.length;
        }

        if (tableFetchError) {
          hasFailures = true;
          tableResults.push({
            name: tableName,
            expected: expectedCount,
            saved: allRows.length,
            ok: false,
            error: sanitizeErrorMessage(tableFetchError),
          });
          continue;
        }

        // Strip sensitive credentials from users and admins tables before chunking
        const sanitizedRows = allRows.map(row => {
          if (tableName === 'users' || tableName === 'admins') {
            const clean = { ...row };
            delete clean.password;
            delete clean.password_hash;
            delete clean.otp;
            delete clean.token;
            delete clean.reset_token;
            delete clean.secret;
            delete clean.refresh_token;
            delete clean.locked_until;
            return clean;
          }
          return row;
        });

        // C. Chunk rows into max 500 rows per doc and save to backup_data
        const chunks = chunkRows(sanitizedRows, CHUNK_SIZE);
        let tableBytes = 0;

        for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
          const chunkData = chunks[chunkIdx];
          const chunkBytes = calculateApproxBytes(chunkData);
          tableBytes += chunkBytes;
          totalAccumulatedBytes += chunkBytes;

          // Check size guard
          if (isSizeExceeded(totalAccumulatedBytes)) {
            throw new Error(`Size guard exceeded: Backup payload (${Math.round(totalAccumulatedBytes / (1024 * 1024))}MB) exceeded 100MB limit.`);
          }

          await backupDataCol.insertOne({
            runId,
            table: tableName,
            chunk: chunkIdx,
            rows: chunkData,
            rowCount: chunkData.length,
            createdAt: new Date(),
          });
        }

        // D. Verify count
        const evalResult = evaluateTableCount(expectedCount, allRows.length);
        if (!evalResult.ok) hasFailures = true;

        tableResults.push({
          name: tableName,
          expected: evalResult.expected,
          saved: evalResult.saved,
          ok: evalResult.ok,
          chunks: chunks.length,
          bytes: tableBytes,
        });
      } catch (err) {
        if (err.message && err.message.includes('Size guard')) {
          throw err;
        }
        hasFailures = true;
        tableResults.push({
          name: tableName,
          expected: 0,
          saved: 0,
          ok: false,
          error: sanitizeErrorMessage(err),
        });
      }
    }

    // 4. Determine final status
    let status = 'success';
    if (wasAbortedDueToTimeout) {
      status = 'partial';
    } else if (hasFailures) {
      status = 'partial';
    }

    const finishedAt = new Date();

    // 5. Update backup_runs record
    await backupRunsCol.updateOne(
      { runId },
      {
        $set: {
          finishedAt,
          status,
          tables: tableResults,
          approxBytes: totalAccumulatedBytes,
          error: null,
        },
      }
    );

    // 6. Retention policy: If SUCCESS, keep latest 14 successful runs and prune older backup_data
    if (status === 'success') {
      try {
        const successfulRuns = await backupRunsCol
          .find({ status: 'success' }, { projection: { runId: 1, startedAt: 1 } })
          .sort({ startedAt: -1 })
          .toArray();

        const runIdsToPrune = findRunsToPrune(
          successfulRuns.map((r) => r.runId),
          RETENTION_RUNS_COUNT
        );

        if (runIdsToPrune.length > 0) {
          await backupDataCol.deleteMany({ runId: { $in: runIdsToPrune } });
          await backupRunsCol.updateMany(
            { runId: { $in: runIdsToPrune } },
            { $set: { dataPruned: true, prunedAt: new Date() } }
          );
        }
      } catch (pruneErr) {
        console.warn('[Backup Retention Warning]:', pruneErr?.message);
      }
    }

    return {
      success: status === 'success' || status === 'partial',
      runId,
      status,
      durationMs: Date.now() - startTime,
      approxBytes: totalAccumulatedBytes,
      tablesProcessed: tableResults.length,
      tables: tableResults.map((t) => ({
        name: t.name,
        expected: t.expected,
        saved: t.saved,
        ok: t.ok,
        skipped: Boolean(t.skipped),
      })),
    };
  } catch (err) {
    fatalError = err;
    const finishedAt = new Date();

    await backupRunsCol.updateOne(
      { runId },
      {
        $set: {
          finishedAt,
          status: 'failed',
          tables: tableResults,
          approxBytes: totalAccumulatedBytes,
          error: sanitizeErrorMessage(err),
        },
      }
    );

    throw err;
  }
}
