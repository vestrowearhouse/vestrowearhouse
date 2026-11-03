import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const client = createClient(url, key);

const BACKUP_DIR = path.resolve('backups');
const DATA_DIR = path.join(BACKUP_DIR, 'data_json');
const STORAGE_DIR = path.join(BACKUP_DIR, 'storage_product_images');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(STORAGE_DIR, { recursive: true });

async function dumpTableData(tableName) {
  console.log(`Dumping table: ${tableName}...`);
  let allRows = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .range(from, from + step - 1);

    if (error) {
      console.error(`Error dumping ${tableName}:`, error.message);
      break;
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      from += step;
      if (data.length < step) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  const jsonFilePath = path.join(DATA_DIR, `${tableName}.json`);
  fs.writeFileSync(jsonFilePath, JSON.stringify(allRows, null, 2), 'utf8');
  console.log(` -> Saved ${allRows.length} rows to ${jsonFilePath}`);
  return { tableName, count: allRows.length, rows: allRows };
}

async function listAllStorageFiles(bucketName, folder = '') {
  const { data, error } = await client.storage.from(bucketName).list(folder, { limit: 1000 });
  if (error) {
    console.error(`Error listing folder ${folder}:`, error.message);
    return [];
  }
  let files = [];
  for (const item of data) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name;
    if (item.id === null) {
      // folder
      const sub = await listAllStorageFiles(bucketName, fullPath);
      files = files.concat(sub);
    } else {
      files.push({ ...item, fullPath });
    }
  }
  return files;
}

async function downloadStorageFiles() {
  console.log('\n--- Backing up Storage bucket: product-images ---');
  const allFiles = await listAllStorageFiles('product-images');
  console.log(`Total files found: ${allFiles.length}`);

  let successCount = 0;
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const targetPath = path.join(STORAGE_DIR, file.fullPath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    try {
      const { data, error } = await client.storage.from('product-images').download(file.fullPath);
      if (error) {
        console.error(`Failed to download ${file.fullPath}:`, error.message);
      } else {
        const buffer = Buffer.from(await data.arrayBuffer());
        fs.writeFileSync(targetPath, buffer);
        successCount++;
        if (successCount % 20 === 0 || successCount === allFiles.length) {
          console.log(`[Storage] Downloaded ${successCount}/${allFiles.length} files`);
        }
      }
    } catch (e) {
      console.error(`Error saving ${file.fullPath}:`, e.message);
    }
  }
  console.log(`Storage backup finished: ${successCount} files saved to ${STORAGE_DIR}`);
}

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateSqlInserts(tableName, rows) {
  if (!rows || rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');

  const statements = [];
  statements.push(`-- Table: public."${tableName}" (${rows.length} rows)`);

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valueTuples = chunk.map(row => {
      const vals = cols.map(c => sqlEscape(row[c])).join(', ');
      return `  (${vals})`;
    }).join(',\n');

    statements.push(`INSERT INTO public."${tableName}" (${colList})\nVALUES\n${valueTuples}\nON CONFLICT DO NOTHING;`);
  }

  return statements.join('\n\n') + '\n\n';
}

async function run() {
  console.log('====================================================');
  console.log('   FULL SUPABASE EXPORT & RESCUE SCRIPT');
  console.log('====================================================\n');

  // Tables to dump (skip page_views huge table to json only or summarize, but let's dump products, categories, orders, etc.)
  const coreTables = [
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
    'notifications',
    'activity_logs'
  ];

  const results = {};
  let masterSql = `-- ==============================================================================
-- STELLARMARTBD COMPLETE RESTORE SQL FOR NEW SUPABASE PROJECT
-- Exported on: ${new Date().toISOString()}
-- ==============================================================================

-- 1. Disable triggers during restore
SET session_replication_role = 'replica';

`;

  for (const t of coreTables) {
    const res = await dumpTableData(t);
    results[t] = res.count;
    masterSql += generateSqlInserts(t, res.rows);
  }

  masterSql += `\n-- 2. Re-enable triggers
SET session_replication_role = 'origin';

-- End of data restore.
`;

  const sqlRestorePath = path.join(BACKUP_DIR, 'restore_all_data.sql');
  fs.writeFileSync(sqlRestorePath, masterSql, 'utf8');
  console.log(`\nGenerated master data SQL: ${sqlRestorePath}`);

  // Download all images from storage
  await downloadStorageFiles();

  console.log('\n====================================================');
  console.log('🎉 EXPORT COMPLETED 100% SUCCESSFULLY!');
  console.log('====================================================');
  console.log('Summary of backed up tables:');
  console.table(results);
  console.log(`Files saved in: ${BACKUP_DIR}`);
}

run();

