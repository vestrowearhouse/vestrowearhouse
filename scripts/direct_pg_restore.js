import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing required environment variable: SUPABASE_DB_URL or DATABASE_URL');
  process.exit(1);
}

async function tryConnect() {
  console.log('Attempting connection to PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('✅ Connected successfully to PostgreSQL');
    return client;
  } catch (e) {
    console.error('❌ Connection attempt failed:', e.message);
    await client.end().catch(() => {});
    return null;
  }
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

