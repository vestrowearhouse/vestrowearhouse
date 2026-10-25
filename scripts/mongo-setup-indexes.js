/**
 * MongoDB Index & TTL Setup Script
 * Sets up TTL and performance indexes ONLY for NEW collections:
 * - page_views (60 days TTL)
 * - events (90 days TTL)
 * - health_checks (30 days TTL)
 * - cache_events (90 days TTL)
 * - backup_runs (No TTL)
 * 
 * Existing collections (page_logs, website_logs, activity_logs, reviews, questions) are left untouched.
 * 
 * Run manually in terminal:
 * node scripts/mongo-setup-indexes.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// 1. Attempt to load environment variables from .env.local
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  try {
    require('dotenv').config({ path: envLocalPath });
  } catch (e) {
    // If dotenv fails, fallback to environment
  }
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('\n❌ ERROR: MONGODB_URI not found in process.env or .env.local');
  console.error('Please make sure MONGODB_URI is configured before running this script.\n');
  process.exit(1);
}

// 60 days = 5,184,000s; 30 days = 2,592,000s; 90 days = 7,776,000s
const SECONDS_IN_DAY = 24 * 60 * 60;
const TTL_60_DAYS = 60 * SECONDS_IN_DAY;
const TTL_30_DAYS = 30 * SECONDS_IN_DAY;
const TTL_90_DAYS = 90 * SECONDS_IN_DAY;

async function setupIndexes() {
  console.log('\n🚀 Starting MongoDB Index Setup for Stellar Mart BD...');
  console.log('Connecting to MongoDB Atlas...');

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB.\n');

    const db = client.db();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. page_views (TTL: 60 days)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📦 Setting up collection: "page_views"...');
    const pageViews = db.collection('page_views');

    await pageViews.createIndex(
      { timestamp: 1 },
      { name: 'ttl_timestamp_60d', expireAfterSeconds: TTL_60_DAYS }
    );
    console.log('  ✓ Created TTL index: timestamp (60 days)');

    await pageViews.createIndex(
      { path: 1, timestamp: -1 },
      { name: 'idx_path_timestamp' }
    );
    console.log('  ✓ Created query index: path + timestamp');

    await pageViews.createIndex(
      { visitorId: 1, timestamp: -1 },
      { name: 'idx_visitor_timestamp' }
    );
    console.log('  ✓ Created query index: visitorId + timestamp');

    // ─────────────────────────────────────────────────────────────────────────
    // 2. events (TTL: 90 days)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Setting up collection: "events"...');
    const events = db.collection('events');

    await events.createIndex(
      { timestamp: 1 },
      { name: 'ttl_timestamp_90d', expireAfterSeconds: TTL_90_DAYS }
    );
    console.log('  ✓ Created TTL index: timestamp (90 days)');

    await events.createIndex(
      { type: 1, timestamp: -1 },
      { name: 'idx_type_timestamp' }
    );
    console.log('  ✓ Created query index: type + timestamp');

    await events.createIndex(
      { visitorId: 1, timestamp: -1 },
      { name: 'idx_visitor_timestamp' }
    );
    console.log('  ✓ Created query index: visitorId + timestamp');

    await events.createIndex(
      { productId: 1, timestamp: -1 },
      { name: 'idx_product_timestamp' }
    );
    console.log('  ✓ Created query index: productId + timestamp');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. health_checks (TTL: 30 days)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Setting up collection: "health_checks"...');
    const healthChecks = db.collection('health_checks');

    await healthChecks.createIndex(
      { timestamp: 1 },
      { name: 'ttl_timestamp_30d', expireAfterSeconds: TTL_30_DAYS }
    );
    console.log('  ✓ Created TTL index: timestamp (30 days)');

    await healthChecks.createIndex(
      { timestamp: -1 },
      { name: 'idx_timestamp_desc' }
    );
    console.log('  ✓ Created query index: timestamp descending');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. cache_events (TTL: 90 days)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Setting up collection: "cache_events"...');
    const cacheEvents = db.collection('cache_events');

    await cacheEvents.createIndex(
      { timestamp: 1 },
      { name: 'ttl_timestamp_90d', expireAfterSeconds: TTL_90_DAYS }
    );
    console.log('  ✓ Created TTL index: timestamp (90 days)');

    await cacheEvents.createIndex(
      { scope: 1, timestamp: -1 },
      { name: 'idx_scope_timestamp' }
    );
    console.log('  ✓ Created query index: scope + timestamp');

    // ─────────────────────────────────────────────────────────────────────────
    // 5. backup_runs (No TTL - Permanent Records)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📦 Setting up collection: "backup_runs"...');
    const backupRuns = db.collection('backup_runs');

    await backupRuns.createIndex(
      { startedAt: -1 },
      { name: 'idx_startedAt_desc' }
    );
    console.log('  ✓ Created query index: startedAt descending (No TTL)');

    await backupRuns.createIndex(
      { status: 1, startedAt: -1 },
      { name: 'idx_status_startedAt' }
    );
    console.log('  ✓ Created query index: status + startedAt');

    console.log('\n======================================================');
    console.log('✨ All new collection indexes have been created successfully!');
    console.log('Existing collections were untouched as intended.');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Failed to setup indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupIndexes();
