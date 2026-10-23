/**
 * scripts/migrate-to-cloudinary.mjs
 * 
 * Supabase Storage → Cloudinary Migration Script
 * 
 * What it does:
 *  1. Supabase products table থেকে সব product fetch করে
 *  2. featuredImage + images[] array তে supabase.co URL আছে কিনা চেক করে
 *  3. সেগুলো Cloudinary তে upload করে
 *  4. Supabase DB তে নতুন Cloudinary URL দিয়ে update করে
 *  5. Failed products log করে রাখে (retry করা যাবে)
 * 
 * Run:
 *   node scripts/migrate-to-cloudinary.mjs
 * 
 * Dry-run (শুধু কী migrate হবে দেখতে):
 *   DRY_RUN=true node scripts/migrate-to-cloudinary.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 5;        // একসাথে কতটা product process করবে
const DELAY_MS = 500;        // প্রতিটার পর delay (rate limit এড়াতে)
const LOG_FILE = './scripts/migration-log.json';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function isSupabaseUrl(url) {
  return typeof url === 'string' && url.includes('supabase.co');
}

function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('cloudinary.com');
}

function needsMigration(url) {
  return isSupabaseUrl(url) && !isCloudinaryUrl(url);
}

let stats = {
  total: 0,
  alreadyMigrated: 0,
  migrated: 0,
  failed: 0,
  skipped: 0,
};

const failedProducts = [];

// ── Upload a single image URL to Cloudinary ───────────────────────────────────
async function uploadUrlToCloudinary(imageUrl, publicId, folder) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      public_id: publicId,
      overwrite: false,       // skip if already exists in Cloudinary
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
    });
    return { success: true, url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    // If already exists, get the existing URL
    if (err?.error?.http_code === 409) {
      const existingUrl = cloudinary.url(publicId, {
        secure: true,
        resource_type: 'image',
      });
      return { success: true, url: existingUrl, publicId };
    }
    return { success: false, error: err.message };
  }
}

// ── Process a single product ──────────────────────────────────────────────────
async function migrateProduct(product) {
  let changed = false;
  let updatedFeaturedImage = product.featuredImage;
  let updatedImages = Array.isArray(product.images) ? [...product.images] : [];

  // Parse images if stored as string
  if (typeof product.images === 'string') {
    try {
      updatedImages = JSON.parse(product.images) || [];
    } catch {
      updatedImages = product.images ? [product.images] : [];
    }
  }

  // ── Migrate featuredImage ────────────────────────────────────────────────
  if (needsMigration(product.featuredImage)) {
    console.log(`  📷 Migrating featuredImage for: ${product.name} (${product.id})`);
    if (!DRY_RUN) {
      const res = await uploadUrlToCloudinary(
        product.featuredImage,
        `product_${product.id}_featured`,
        'stellar-mart/products'
      );
      if (res.success) {
        updatedFeaturedImage = res.url;
        changed = true;
        console.log(`     ✅ featuredImage → ${res.url}`);
      } else {
        console.error(`     ❌ featuredImage failed: ${res.error}`);
        failedProducts.push({ id: product.id, name: product.name, field: 'featuredImage', error: res.error });
      }
    } else {
      console.log(`     [DRY RUN] Would migrate: ${product.featuredImage}`);
      changed = true;
    }
  } else if (isCloudinaryUrl(product.featuredImage)) {
    // Already on Cloudinary
  }

  // ── Migrate images[] array ───────────────────────────────────────────────
  for (let i = 0; i < updatedImages.length; i++) {
    const imgUrl = updatedImages[i];
    if (needsMigration(imgUrl)) {
      console.log(`  🖼️  Migrating image[${i}] for: ${product.name}`);
      if (!DRY_RUN) {
        const res = await uploadUrlToCloudinary(
          imgUrl,
          `product_${product.id}_img_${i}`,
          'stellar-mart/products'
        );
        if (res.success) {
          updatedImages[i] = res.url;
          changed = true;
          console.log(`     ✅ image[${i}] → ${res.url}`);
        } else {
          console.error(`     ❌ image[${i}] failed: ${res.error}`);
          failedProducts.push({ id: product.id, name: product.name, field: `images[${i}]`, error: res.error });
        }
      } else {
        console.log(`     [DRY RUN] Would migrate: ${imgUrl}`);
        changed = true;
      }
    }
  }

  // ── Update Supabase DB ───────────────────────────────────────────────────
  if (changed && !DRY_RUN) {
    const updatePayload = {};
    if (updatedFeaturedImage !== product.featuredImage) {
      updatePayload.featuredImage = updatedFeaturedImage;
    }
    // Only update images if array actually changed
    const imagesChanged = updatedImages.some((url, i) => url !== (product.images?.[i] || ''));
    if (imagesChanged) {
      updatePayload.images = updatedImages;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateErr } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', product.id);

      if (updateErr) {
        console.error(`  ❌ DB update failed for ${product.id}:`, updateErr.message);
        failedProducts.push({ id: product.id, name: product.name, field: 'db_update', error: updateErr.message });
      } else {
        console.log(`  ✅ DB updated for: ${product.name}`);
        stats.migrated++;
      }
    }
  } else if (changed && DRY_RUN) {
    stats.migrated++;
  } else {
    stats.alreadyMigrated++;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Supabase Storage → Cloudinary Migration Script    ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE — কোনো change হবে না, শুধু দেখাবে\n');
  }

  // Fetch all products
  console.log('📦 Supabase থেকে products fetch করছি...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, featuredImage, images')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Products fetch failed:', error.message);
    process.exit(1);
  }

  stats.total = products.length;
  console.log(`✅ মোট ${products.length} টি product পাওয়া গেছে\n`);

  // Find products that need migration
  const toMigrate = products.filter(p => {
    const imagesArr = Array.isArray(p.images) ? p.images : [];
    return needsMigration(p.featuredImage) || imagesArr.some(needsMigration);
  });

  console.log(`📊 Migration দরকার: ${toMigrate.length} টি product`);
  console.log(`📊 Already Cloudinary: ${products.length - toMigrate.length} টি product\n`);

  if (toMigrate.length === 0) {
    console.log('🎉 সব image ইতোমধ্যে Cloudinary তে আছে!');
    return;
  }

  // Process in batches
  for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
    const batch = toMigrate.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toMigrate.length / BATCH_SIZE);

    console.log(`\n── Batch ${batchNum}/${totalBatches} ─────────────────────────────`);

    for (const product of batch) {
      console.log(`\n🔄 Processing: ${product.name} (${product.id})`);
      await migrateProduct(product);
      await sleep(DELAY_MS);
    }

    // Progress
    const done = Math.min(i + BATCH_SIZE, toMigrate.length);
    const pct = Math.round((done / toMigrate.length) * 100);
    console.log(`\n📈 Progress: ${done}/${toMigrate.length} (${pct}%)`);
  }

  // ── Final Report ─────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  Migration Complete                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`✅ মোট products:       ${stats.total}`);
  console.log(`✅ নতুন migrate:       ${stats.migrated}`);
  console.log(`🔵 আগে থেকে ছিল:      ${stats.alreadyMigrated}`);
  console.log(`❌ Failed:             ${failedProducts.length}`);

  if (failedProducts.length > 0) {
    console.log('\n⚠️  Failed products (retry করুন):');
    failedProducts.forEach(f => {
      console.log(`   - ${f.name} (${f.id}) [${f.field}]: ${f.error}`);
    });

    // Save failed log
    fs.writeFileSync(
      LOG_FILE,
      JSON.stringify({ failedAt: new Date().toISOString(), failed: failedProducts }, null, 2)
    );
    console.log(`\n📝 Failed log saved: ${LOG_FILE}`);
  }

  if (!DRY_RUN && stats.migrated > 0) {
    console.log('\n✅ পরের কাজ:');
    console.log('   1. Supabase Dashboard → Storage → product-images bucket এ গিয়ে');
    console.log('      সব files delete করো (এখন এগুলো আর দরকার নেই)');
    console.log('   2. Vercel এ redeploy করো');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
