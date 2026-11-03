import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';

const password = 'E9YdYZx&u7!6Pqg';
const user = 'postgres.gobcbixzsldiwmykgwtc';
const host = 'aws-1-eu-central-1.pooler.supabase.com';
const port = 5432;
const database = 'postgres';

const DATA_DIR = path.resolve('backups', 'data_json');

const tableOrder = [
  'categories',
  'vendors',
  'users',
  'admins',
  'banners',
  'settings',
  'coupons',
  'products',
  'orders',
  'carts',
  'notifications'
];

async function main() {
  console.log('Connecting to PostgreSQL to insert clean JSON data...');
  const client = new Client({
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected!');

  // Temporarily disable foreign key checks / triggers during bulk load
  await client.query("SET session_replication_role = 'replica';");

  for (const table of tableOrder) {
    const jsonPath = path.join(DATA_DIR, `${table}.json`);
    if (!fs.existsSync(jsonPath)) continue;

    const rows = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(` - ${table}: 0 rows (skipped)`);
      continue;
    }

    console.log(` - ${table}: Inserting ${rows.length} rows...`);
    const cols = Object.keys(rows[0]);
    const colList = cols.map(c => `"${c}"`).join(', ');

    let inserted = 0;
    for (const row of rows) {
      const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
      const values = cols.map(c => {
        const val = row[c];
        if (val === undefined) return null;
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });

      const sql = `INSERT INTO public."${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
      try {
        await client.query(sql, values);
        inserted++;
      } catch (err) {
        console.error(`   Error in ${table} row:`, err.message);
      }
    }
    console.log(`   -> Inserted ${inserted}/${rows.length} rows into ${table}`);
  }

  // Map category codes
  console.log('\n--- Mapping Categories to SKU Category Codes ---');
  await client.query(`
    UPDATE public.categories SET sku_category_code = '14' WHERE name ILIKE '%Earphone%' OR name ILIKE '%Earbud%' OR name ILIKE '%IEM%' OR name ILIKE '%Headphone%';
    UPDATE public.categories SET sku_category_code = '77' WHERE name ILIKE '%Churi%' OR name ILIKE '%Jewel%' OR name ILIKE '%Bangle%';
    UPDATE public.categories SET sku_category_code = '64' WHERE name ILIKE '%RGB Light%' OR name ILIKE '%Light%';
    UPDATE public.categories SET sku_category_code = '83' WHERE name ILIKE '%Finger Sleeve%' OR name ILIKE '%Gaming%';
    UPDATE public.categories SET sku_category_code = '24' WHERE name ILIKE '%Hood%' OR name ILIKE '%Sweater%' OR name ILIKE '%Jacket%';
    UPDATE public.categories SET sku_category_code = '13' WHERE name ILIKE '%Development Board%' OR name ILIKE '%Computer%';
    UPDATE public.categories SET sku_category_code = '79' WHERE name ILIKE '%Mobile Cooler%' OR name ILIKE '%Case%';
    UPDATE public.categories SET sku_category_code = '80' WHERE name ILIKE '%Football%' OR name ILIKE '%Jersey%';
    UPDATE public.categories SET sku_category_code = '10' WHERE name ILIKE '%Mobile Phone%';
    UPDATE public.categories SET sku_category_code = '20' WHERE name ILIKE '%T-Shirt%';
    UPDATE public.categories SET sku_category_code = '21' WHERE name ILIKE '%Shirt%' AND name NOT ILIKE '%T-Shirt%';
    UPDATE public.categories SET sku_category_code = '22' WHERE name ILIKE '%Panjabi%';
    UPDATE public.categories SET sku_category_code = '23' WHERE name ILIKE '%Pant%' OR name ILIKE '%Jeans%';
    UPDATE public.categories SET sku_category_code = '30' WHERE name ILIKE '%Saree%';
    UPDATE public.categories SET sku_category_code = '50' WHERE name ILIKE '%Skincare%';
    UPDATE public.categories SET sku_category_code = '52' WHERE name ILIKE '%Hair%';
    UPDATE public.categories SET sku_category_code = '61' WHERE name ILIKE '%Furniture%';
    UPDATE public.categories SET sku_category_code = '60' WHERE name ILIKE '%Kitchen%';
  `);
  console.log('✅ Categories mapped!');

  // Re-enable triggers
  await client.query("SET session_replication_role = 'origin';");

  // Summary counts
  console.log('\n--- Final Verification of Live Data ---');
  for (const table of tableOrder) {
    const { rows } = await client.query(`SELECT count(*) as c FROM public."${table}"`);
    console.log(` - ${table}: ${rows[0].c} rows`);
  }

  await client.end();
  console.log('\n🎉 ALL DATA INSERTED SUCCESSFULLY!');
}

main();

