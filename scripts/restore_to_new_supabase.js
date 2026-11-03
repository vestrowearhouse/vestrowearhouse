import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const BACKUP_DIR = path.resolve('backups');
const DATA_DIR = path.join(BACKUP_DIR, 'data_json');
const STORAGE_DIR = path.join(BACKUP_DIR, 'storage_product_images');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) parsed.url = args[++i];
    if (args[i] === '--service-key' && args[i + 1]) parsed.serviceKey = args[++i];
    if (args[i] === '--anon-key' && args[i + 1]) parsed.anonKey = args[++i];
  }
  return parsed;
}

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function uploadStorage(client) {
  console.log('\n--- Restoring Storage Bucket: product-images ---');
  // Check or create bucket
  const { data: buckets, error: bErr } = await client.storage.listBuckets();
  const exists = buckets && buckets.some(b => b.name === 'product-images');
  if (!exists) {
    console.log('Creating bucket product-images...');
    const { error: cErr } = await client.storage.createBucket('product-images', { public: true });
    if (cErr) console.warn('Bucket creation note:', cErr.message);
  } else {
    console.log('Bucket product-images already exists.');
  }

  const files = getAllFiles(STORAGE_DIR);
  console.log(`Found ${files.length} storage files to upload.`);

  let uploaded = 0;
  for (const f of files) {
    const relativePath = path.relative(STORAGE_DIR, f).replace(/\\/g, '/');
    const fileBuffer = fs.readFileSync(f);
    
    // Determine content type
    let contentType = 'image/jpeg';
    if (f.endsWith('.png')) contentType = 'image/png';
    else if (f.endsWith('.webp')) contentType = 'image/webp';
    else if (f.endsWith('.svg')) contentType = 'image/svg+xml';

    const { error } = await client.storage.from('product-images').upload(relativePath, fileBuffer, {
      contentType,
      upsert: true
    });

    if (error) {
      console.error(`Failed to upload ${relativePath}:`, error.message);
    } else {
      uploaded++;
      if (uploaded % 20 === 0 || uploaded === files.length) {
        console.log(`[Storage] Restored ${uploaded}/${files.length} files`);
      }
    }
  }
}

async function restoreTables(client) {
  console.log('\n--- Restoring Database Tables from JSON ---');
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
    'notifications',
    'activity_logs'
  ];

  for (const table of tableOrder) {
    const filePath = path.join(DATA_DIR, `${table}.json`);
    if (!fs.existsSync(filePath)) continue;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(data) || data.length === 0) {
      console.log(` - ${table}: 0 rows (skipped)`);
      continue;
    }

    console.log(` - ${table}: Uploading ${data.length} rows...`);
    // Upload in batches of 50
    const chunkSize = 50;
    let ok = 0;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const { error } = await client.from(table).upsert(chunk);
      if (error) {
        console.error(`   Error inserting into ${table} (chunk ${i}):`, error.message);
      } else {
        ok += chunk.length;
      }
    }
    console.log(`   -> Restored ${ok}/${data.length} rows to ${table}`);
  }
}

function updateEnvLocal(newUrl, newAnonKey, newServiceKey) {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) return;

  let content = fs.readFileSync(envPath, 'utf8');
  if (newUrl) {
    content = content.replace(/NEXT_PUBLIC_SUPABASE_URL=\"[^\"]*\"/g, `NEXT_PUBLIC_SUPABASE_URL="${newUrl}"`);
  }
  if (newAnonKey) {
    content = content.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=\"[^\"]*\"/g, `NEXT_PUBLIC_SUPABASE_ANON_KEY="${newAnonKey}"`);
    content = content.replace(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=\"[^\"]*\"/g, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${newAnonKey}"`);
  }
  if (newServiceKey) {
    content = content.replace(/SUPABASE_SERVICE_ROLE_KEY=\"[^\"]*\"/g, `SUPABASE_SERVICE_ROLE_KEY="${newServiceKey}"`);
  }

  fs.writeFileSync(envPath, content, 'utf8');
  console.log('\nUpdated .env.local with new Supabase credentials.');
}

async function main() {
  const { url, serviceKey, anonKey } = parseArgs();

  if (!url || !serviceKey) {
    console.log(`
Usage:
  node scripts/restore_to_new_supabase.js --url <SUPABASE_URL> --service-key <SERVICE_ROLE_KEY> [--anon-key <ANON_KEY>]

Example:
  node scripts/restore_to_new_supabase.js --url https://xyz.supabase.co --service-key eyJ... --anon-key eyJ...
    `);
    process.exit(1);
  }

  console.log('Connecting to target Supabase project:', url);
  const client = createClient(url, serviceKey);

  await restoreTables(client);
  await uploadStorage(client);

  if (anonKey) {
    updateEnvLocal(url, anonKey, serviceKey);
  } else {
    updateEnvLocal(url, null, serviceKey);
  }

  console.log('\n====================================================');
  console.log('🎉 RESTORE TO NEW SUPABASE COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

main();

