/**
 * Mongo IP Scrubbing Script
 * Scans activity_logs and page_logs for raw "ip" fields.
 * 
 * Default: Dry run (prints counts without modifying data)
 * Apply: Run with --apply to unset raw "ip" field
 * 
 * Usage in terminal:
 *   node scripts/mongo-scrub-ip.js          # Dry run
 *   node scripts/mongo-scrub-ip.js --apply  # Actually scrub raw IPs
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
    // Fallback to process.env
  }
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('\n❌ ERROR: MONGODB_URI not found in environment or .env.local\n');
  process.exit(1);
}

const isApplyMode = process.argv.includes('--apply');

async function scrubIps() {
  console.log('\n======================================================');
  console.log(`🧹 MongoDB Raw IP Scrub Utility [Mode: ${isApplyMode ? 'APPLY' : 'DRY-RUN'}]`);
  console.log('======================================================');

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db();

    const collections = ['activity_logs', 'page_logs'];

    for (const colName of collections) {
      console.log(`\n🔍 Checking collection "${colName}"...`);
      const collection = db.collection(colName);

      const count = await collection.countDocuments({ ip: { $exists: true } });
      console.log(`  -> Documents with raw "ip" field: ${count}`);

      if (isApplyMode) {
        if (count > 0) {
          const result = await collection.updateMany(
            { ip: { $exists: true } },
            { $unset: { ip: '' } }
          );
          console.log(`  ✅ Successfully scrubbed "ip" field from ${result.modifiedCount} documents.`);
        } else {
          console.log('  ✨ No documents needed scrubbing in this collection.');
        }
      }
    }

    console.log('\n======================================================');
    if (!isApplyMode) {
      console.log('ℹ️  DRY RUN complete. No documents were modified.');
      console.log('To permanently scrub raw IP fields, run:');
      console.log('   node scripts/mongo-scrub-ip.js --apply');
    } else {
      console.log('✅ APPLY complete. All raw IP fields have been scrubbed.');
    }
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Error during scrubbing process:', error.message || error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

scrubIps();
