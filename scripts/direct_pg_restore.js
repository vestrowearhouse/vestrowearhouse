import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';

const password = process.argv[2];

if (!password) {
  console.error('Please provide database password: node scripts/direct_pg_restore.js <DB_PASSWORD>');
  process.exit(1);
}

// Connection configs to try (Direct or Pooler)
const projectRef = 'gobcbixzsldiwmykgwtc';
const connectionStrings = [
  // Session pooler (eu-central-1)
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
  // Transaction pooler
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  // Direct
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
];

async function tryConnect() {
  for (const connStr of connectionStrings) {
    console.log('Attempting connection to PostgreSQL...');
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log('✅ Connected successfully to PostgreSQL via:', connStr.replace(/:[^:@]+@/, ':****@'));
      return client;
    } catch (e) {
      console.log('❌ Connection attempt failed:', e.message);
      await client.end().catch(() => {});
    }
  }
  return null;
}

async function run() {
  const client = await tryConnect();
  if (!client) {
    console.error('Could not connect to Supabase PostgreSQL with the provided password.');
    process.exit(1);
  }

  try {
    console.log('\n--- 1. Executing Schema and SKU Setup ---');
    const schemaSql = fs.readFileSync(path.resolve('backups', '1_FULL_SCHEMA_AND_SKU_SETUP.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('✅ Schema & SKU System tables and RPCs created successfully!');

    console.log('\n--- 2. Restoring Core Store Data (Categories, Products, Users, Banners) ---');
    const dataSql = fs.readFileSync(path.resolve('backups', '2_RESTORE_STORE_DATA.sql'), 'utf8');
    await client.query(dataSql);
    console.log('✅ Store data restored successfully!');

    console.log('\n--- 3. Verifying Restored Data ---');
    const { rows: catCount } = await client.query('SELECT count(*) FROM public.categories;');
    const { rows: prodCount } = await client.query('SELECT count(*) FROM public.products;');
    console.log(` - Categories: ${catCount[0].count} rows`);
    console.log(` - Products: ${prodCount[0].count} rows`);

    console.log('\n🎉 DIRECT POSTGRESQL RESTORE COMPLETED 100%!');
  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    await client.end();
  }
}

run();

