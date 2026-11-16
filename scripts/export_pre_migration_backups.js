const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function exportBackups() {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Missing required environment variable: SUPABASE_DB_URL or DATABASE_URL');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  function toCsv(rows) {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const lines = [];
    lines.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    for (const row of rows) {
      const vals = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      lines.push(vals.join(','));
    }
    return lines.join('\n');
  }

  // 1. products
  const prodsRes = await client.query('SELECT * FROM public.products ORDER BY created_at ASC');
  const prodsCsv = toCsv(prodsRes.rows);
  fs.writeFileSync(path.resolve('backups', 'products_backup.csv'), prodsCsv, 'utf8');
  console.log(`✅ Exported backups/products_backup.csv: ${prodsRes.rows.length} rows`);

  // 2. sku_registry
  const regRes = await client.query('SELECT * FROM public.sku_registry ORDER BY sku ASC');
  const regCsv = toCsv(regRes.rows);
  fs.writeFileSync(path.resolve('backups', 'sku_registry_backup.csv'), regCsv, 'utf8');
  console.log(`✅ Exported backups/sku_registry_backup.csv: ${regRes.rows.length} rows`);

  // 3. sku_categories
  const catsRes = await client.query('SELECT * FROM public.sku_categories ORDER BY code ASC');
  const catsCsv = toCsv(catsRes.rows);
  fs.writeFileSync(path.resolve('backups', 'sku_categories_backup.csv'), catsCsv, 'utf8');
  console.log(`✅ Exported backups/sku_categories_backup.csv: ${catsRes.rows.length} rows`);

  await client.end();
}

exportBackups().catch(console.error);

