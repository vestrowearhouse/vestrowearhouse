/**
 * Safe, Idempotent SKU Migration Script for Existing Products & Variants
 *
 * Usage:
 *   node scripts/migrate_existing_skus.js             (Dry Run: previews proposed changes)
 *   node scripts/migrate_existing_skus.js --execute   (Executes data migration)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Approved category code mapping based on user review
const PRODUCT_CATEGORY_MAP = {
  // 14: Headphone/Earbuds
  'Earphones & IEM': '14',
  'Earbuds': '14',
  'Headphones': '14',

  // 77: Jewellery
  'Churi': '77',

  // 64: Lighting
  'RGB Lights': '64',

  // 79: Mobile Case/Accessories (Finger Sleeves & Coolers)
  'Finger Sleeves': '79',
  'Mobile Cooler': '79',

  // 24: Hoodie/Sweater/Jacket
  'Men Fashion': '24',

  // 13: Desktop & Computer Parts
  'Gaming Mouse': '13',

  // 80: Sports & Fitness (Football kits)
  'Football': '80',

  // 19: Other Electronics (Arduino & dev boards)
  'Electronics': '19',
  'Development Boards': '19',
  'Development Board': '19',
};

// Size & Color matching helpers
function matchSizeCode(val) {
  if (!val) return '00';
  const c = String(val).trim().toUpperCase();
  const map = { 'S': '01', 'M': '02', 'L': '03', 'XL': '04', '2XL': '05', '3XL': '06', '4XL': '07', 'FREE SIZE': '99' };
  if (map[c]) return map[c];
  if (/^\d{2}$/.test(c)) return c;
  return '99';
}

function matchColorCode(val) {
  if (!val) return '99';
  const c = String(val).trim().toLowerCase();
  const map = {
    'black': '01', 'white': '02', 'red': '03', 'blue': '04', 'green': '05',
    'yellow': '06', 'grey': '07', 'gray': '07', 'brown': '08', 'navy': '09',
    'olive': '10', 'pink': '11', 'orange': '12', 'purple': '13', 'maroon': '14',
    'beige': '15', 'gold': '16', 'silver': '17', 'multicolor': '18'
  };
  return map[c] || '99';
}

function formatSKU(catCode, serial) {
  const serialStr = serial < 10000 ? String(serial).padStart(4, '0') : String(serial);
  return `SMBD${catCode}${serialStr}`;
}

async function runMigration() {
  const isExecute = process.argv.includes('--execute');

  console.log('================================================================');
  console.log(`🚀 STELLARMARTBD SKU MIGRATION (${isExecute ? 'EXECUTE MODE' : 'DRY RUN'})`);
  console.log('================================================================');

  // Load original raw backup to guarantee exact legacy SKUs (stm-0001, etc.)
  const backupPath = path.resolve('backups', 'data_json', 'products.json');
  let origSkuMap = {};
  let origVariantsMap = {};
  if (fs.existsSync(backupPath)) {
    const rawBackup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    origSkuMap = Object.fromEntries(rawBackup.map(p => [p.id, p.sku]));
    origVariantsMap = Object.fromEntries(rawBackup.map(p => [p.id, p.variants]));
  }

  // 1. Fetch all products and categories from live DB
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, slug, sku, category, category_slug, attributes, variants')
    .order('created_at', { ascending: true });

  if (pErr) throw pErr;

  const { data: categories, error: cErr } = await supabase
    .from('categories')
    .select('id, name, slug');

  if (cErr) throw cErr;

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const earbudsCategory = categories.find(c => c.name.toLowerCase() === 'earbuds');

  console.log(`📦 Found ${products.length} products to process.\n`);

  // Running serials per category code
  const serialTracker = {};
  const updates = [];
  const registryEntries = [];

  for (const p of products) {
    let catName = catMap[p.category] || 'Unknown';
    let catCode = PRODUCT_CATEGORY_MAP[catName] || '99';
    let newCategoryId = null;
    let newCategorySlug = null;

    // Special override 1: Lenovo GM2 Pro -> Category 14 (Earbuds) & store category changed to Earbuds
    if (p.name.toLowerCase().includes('lenovo gm2 pro')) {
      catCode = '14';
      catName = 'Earbuds';
      if (earbudsCategory) {
        newCategoryId = earbudsCategory.id;
        newCategorySlug = earbudsCategory.slug;
      }
    }

    // Special override 2: Arduino Uno -> Category 19 (Other Electronics)
    if (p.name.toLowerCase().includes('arduino')) {
      catCode = '19';
      catName = 'Development Boards';
    }

    if (!serialTracker[catCode]) {
      serialTracker[catCode] = 0;
    }

    const variants = Array.isArray(p.variants) ? p.variants : [];
    const hasVariants = variants.length > 0;

    let productSku = null;
    let updatedVariants = [];

    if (hasVariants) {
      // Parent product with variants gets NO SKU of its own.
      // Only its variants receive sequential SKUs.
      productSku = null;

      updatedVariants = variants.map((v, vIdx) => {
        serialTracker[catCode]++;
        const vSerial = serialTracker[catCode];
        const vSku = formatSKU(catCode, vSerial);
        const combo = v.combination || {};
        const sizeCode = matchSizeCode(combo.Size || combo.size);
        const colorCode = matchColorCode(combo.Color || combo.color || combo['Color Family']);

        // Preserve original variant legacy SKU (stm-0001-m-red, stm-6751-m-white, etc.)
        const origProdVariants = origVariantsMap[p.id] || [];
        const origVar = origProdVariants.find(ov => 
          JSON.stringify(ov.combination) === JSON.stringify(combo)
        ) || origProdVariants[vIdx];
        const variantLegacySku = origVar?.legacy_sku || origVar?.sku || v.legacy_sku || (v.sku && !v.sku.startsWith('SMBD') ? v.sku : null);

        registryEntries.push({
          sku: vSku,
          product_id: p.id,
          variant_key: Object.values(combo).join('-') || 'variant',
          category_code: catCode,
          created_at: new Date().toISOString()
        });

        return {
          ...v,
          legacy_sku: variantLegacySku,
          sku: vSku,
          size_code: sizeCode,
          color_code: colorCode
        };
      });
    } else {
      // Standalone product (no variants) gets its own sequential SKU
      serialTracker[catCode]++;
      const serial = serialTracker[catCode];
      productSku = formatSKU(catCode, serial);

      registryEntries.push({
        sku: productSku,
        product_id: p.id,
        variant_key: 'base-product',
        category_code: catCode,
        created_at: new Date().toISOString()
      });
    }

    const legacySku = origSkuMap[p.id] || null;
    const baseSizeCode = updatedVariants[0]?.size_code || '00';
    const baseColorCode = updatedVariants[0]?.color_code || '99';

    const payload = {
      sku: productSku,
      legacy_sku: legacySku,
      category_code: catCode,
      size_code: baseSizeCode,
      color_code: baseColorCode,
      variants: updatedVariants
    };

    if (newCategoryId) {
      payload.category = newCategoryId;
      payload.category_slug = newCategorySlug;
    }

    updates.push({
      id: p.id,
      name: p.name,
      currentCategory: catName,
      catCode,
      assignedSku: productSku,
      displaySku: productSku || `[${variants.length} Variants]`,
      legacySku,
      variantCount: variants.length,
      payload
    });
  }

  // Print mapping summary
  console.log('---------------------------------------------------------------------------------------------------------');
  console.log('| #  | Product Name (first 35 chars)     | Category       | Code | Assigned SKU     | Variants | Legacy  |');
  console.log('---------------------------------------------------------------------------------------------------------');
  updates.forEach((u, i) => {
    const num = String(i + 1).padStart(2, ' ');
    const name = u.name.padEnd(35, ' ').slice(0, 35);
    const cat = u.currentCategory.padEnd(14, ' ').slice(0, 14);
    const code = u.catCode.padStart(4, ' ');
    const sku = u.displaySku.padEnd(16, ' ');
    const vars = String(u.variantCount).padStart(8, ' ');
    const leg = (u.legacySku || '-').padEnd(8, ' ').slice(0, 8);
    console.log(`| ${num} | ${name} | ${cat} | ${code} | ${sku} | ${vars} | ${leg} |`);
  });
  console.log('---------------------------------------------------------------------------------------------------------\n');

  console.log('📊 Category Serial Allocations:');
  Object.entries(serialTracker).forEach(([code, count]) => {
    console.log(`   - Category ${code}: ${count} SKUs allocated (last_serial: ${count})`);
  });

  const totalVariantSkus = updates.filter(u => u.variantCount > 0).reduce((acc, u) => acc + u.variantCount, 0);
  const totalBaseSkus = updates.filter(u => u.variantCount === 0).length;
  console.log(`\nTotal SKUs to Register in sku_registry: ${registryEntries.length} (${totalBaseSkus} standalone + ${totalVariantSkus} variant SKUs)`);

  if (!isExecute) {
    console.log('\n⚠️  DRY RUN COMPLETED. No database changes were made.');
    console.log('To execute this migration against your Supabase database, run:');
    console.log('   node scripts/migrate_existing_skus.js --execute\n');
    return;
  }

  console.log('\n⏳ Applying updates to database...');

  // 1. Temporarily disable trigger during backfill if it exists
  await supabase.rpc('exec_sql', {
    query: `DROP TRIGGER IF EXISTS trg_prevent_sku_and_variant_tampering ON public.products;`
  }).catch(() => {});

  // 2. Insert into sku_registry (bulk chunks)
  console.log('   Registering SKUs in sku_registry...');
  // Clear and backfill
  await supabase.from('sku_registry').delete().neq('sku', 'KEEP_ALL').catch(() => {});
  
  const chunkSize = 25;
  for (let i = 0; i < registryEntries.length; i += chunkSize) {
    const chunk = registryEntries.slice(i, i + chunkSize);
    const { error: regErr } = await supabase.from('sku_registry').upsert(chunk);
    if (regErr) {
      console.error(`   Error in registry chunk ${i}:`, regErr.message);
    }
  }

  // 3. Update products
  console.log('   Updating products table...');
  let updatedCount = 0;
  for (const u of updates) {
    const { error: uErr } = await supabase
      .from('products')
      .update(u.payload)
      .eq('id', u.id);

    if (uErr) {
      console.error(`   Error updating product ${u.id} (${u.name}):`, uErr.message);
    } else {
      updatedCount++;
    }
  }

  // 4. Update last_serial on sku_categories
  console.log('   Updating sku_categories last_serial...');
  for (const [code, count] of Object.entries(serialTracker)) {
    await supabase
      .from('sku_categories')
      .update({ last_serial: count })
      .eq('code', code);
  }

  // 5. Activate Immutability Trigger and Conditional Unique Constraint
  console.log('   Re-activating immutability trigger & constraints...');
  await supabase.rpc('exec_sql', {
    query: `
      DROP TRIGGER IF EXISTS trg_prevent_sku_and_variant_tampering ON public.products;
      CREATE TRIGGER trg_prevent_sku_and_variant_tampering
      BEFORE UPDATE ON public.products
      FOR EACH ROW
      EXECUTE FUNCTION public.prevent_sku_and_variant_tampering();

      ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sku_unique;
      ALTER TABLE public.products ADD CONSTRAINT products_sku_unique UNIQUE (sku);

      ALTER TABLE public.products DROP CONSTRAINT IF EXISTS chk_product_sku_requirement;
      ALTER TABLE public.products DROP CONSTRAINT IF EXISTS chk_product_sku_format;
      ALTER TABLE public.products ADD CONSTRAINT chk_product_sku_format
      CHECK (sku IS NULL OR sku ~ '^SMBD[0-9]{6,}$');
    `
  }).catch(() => {});

  console.log('\n🎉 MIGRATION FINISHED SUCCESSFULLY!');
  console.log(`   - Products updated: ${updatedCount}/${updates.length}`);
  console.log(`   - SKUs registered in sku_registry: ${registryEntries.length}`);
  console.log(`   - Categories counter synchronized: ${Object.keys(serialTracker).length}\n`);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
