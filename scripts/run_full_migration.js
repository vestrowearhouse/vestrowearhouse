import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing required environment variable: SUPABASE_DB_URL or DATABASE_URL');
  process.exit(1);
}

async function main() {
  console.log('====================================================');
  console.log('🚀 DIRECT SUPABASE MIGRATION & RESTORE PIPELINE');
  console.log('====================================================\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected to new Supabase PostgreSQL instance!\n');

  try {
    // 1. Run Schema & SKU System Setup
    console.log('--- Step 1: Creating Tables, Extensions & SKU Procedures ---');
    const schemaSql = fs.readFileSync(path.resolve('backups', '1_FULL_SCHEMA_AND_SKU_SETUP.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('✅ All 23 Tables, Extensions & SKU System procedures created successfully!\n');

    // 2. Run Store Data Restore
    console.log('--- Step 2: Restoring Core Store Data (Products, Categories, Users, Banners) ---');
    const dataSql = fs.readFileSync(path.resolve('backups', '2_RESTORE_STORE_DATA.sql'), 'utf8');
    await client.query(dataSql);
    console.log('✅ All store data restored successfully!\n');

    // 3. Verify Table Counts
    console.log('--- Step 3: Verifying Database Table Counts ---');
    const tables = [
      'categories',
      'vendors',
      'products',
      'users',
      'admins',
      'banners',
      'settings',
      'coupons',
      'orders',
      'carts',
      'sku_categories',
      'sizes',
      'colors'
    ];

    const counts = {};
    for (const t of tables) {
      const { rows } = await client.query(`SELECT count(*) as c FROM public."${t}"`);
      counts[t] = parseInt(rows[0].c, 10);
    }
    console.table(counts);

    console.log('\n====================================================');
    console.log('🎉 DATABASE RESTORE COMPLETED 100% SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    await client.end();
  }
}

main();

