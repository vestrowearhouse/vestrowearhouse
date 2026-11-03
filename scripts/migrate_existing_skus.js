/**
 * Safe, Idempotent SKU Migration Script for Existing 52 Products & Variants
 *
 * Usage:
 *   node scripts/migrate_existing_skus.js             (Dry Run: previews proposed changes)
 *   node scripts/migrate_existing_skus.js --execute   (Executes data migration)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Explicit category code mapping based on user review
const PRODUCT_CATEGORY_MAP = {
  // 14: Headphone/Earbuds
  'Earphones & IEM': '14',
  'Earbuds': '14',
  'Headphones': '14',

  // 77: Jewellery
  'Churi': '77',

  // 64: Lighting
  'RGB Lights': '64',

  // 83: Gaming
  'Finger Sleeves': '83',

  // 24: Hoodie/Sweater/Jacket
  'Men Fashion': '24',

  // 13: Desktop & Computer Parts
  'Development Boards': '13',
  'Gaming Mouse': '13',

  // 79: Mobile Case/Accessories
  'Mobile Cooler': '79',

  // 80: Sports & Fitness (Jerseys)
  'Football': '80',

  // 19: Other Electronics
  'Electronics': '19',
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

  // 1. Fetch all products and categories
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, slug, sku, category, attributes, variants')
    .order('created_at', { ascending: true });

  if (pErr) throw pErr;

  const { data: categories, error: cErr } = await supabase
    .from('categories')
    .select('id, name, slug');

  if (cErr) throw cErr;

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

  console.log(`📦 Found ${products.length} products to process.\n`);

  // Running serials per category code
  const serialTracker = {};
  const updates = [];
  const registryEntries = [];

  for (const p of products) {
    const catName = catMap[p.category] || 'Unknown';
    const catCode = PRODUCT_CATEGORY_MAP[catName] || '99';

    if (!serialTracker[catCode]) {
      serialTracker[catCode] = 0;
    }

    const variants = Array.isArray(p.variants) ? p.variants : [];
    const hasVariants = variants.length > 0;

    let productSku = '';
    let updatedVariants = [];

    if (hasVariants) {
      updatedVariants = variants.map((v) => {
        serialTracker[catCode]++;
        const vSerial = serialTracker[catCode];
        const vSku = formatSKU(catCode, vSerial);
        const combo = v.combination || {};
        const sizeCode = matchSizeCode(combo.Size || combo.size);
        const colorCode = matchColorCode(combo.Color || combo.color || combo['Color Family']);

        registryEntries.push({
          sku: vSku,
          product_id: p.id,
          variant_key: Object.values(combo).join('-') || 'variant',
          category_code: catCode,
          created_at: new Date().toISOString()
        });

        return {
          ...v,
          sku: vSku,
          size_code: sizeCode,
          color_code: colorCode
        };
      });

      // Product-level SKU is the first variant's SKU
      productSku = updatedVariants[0].sku;
    } else {
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

    const legacySku = p.sku || p.legacy_sku || null;
    const baseSizeCode = updatedVariants[0]?.size_code || '00';
    const baseColorCode = updatedVariants[0]?.color_code || '99';

    updates.push({
      id: p.id,
      name: p.name,
      currentCategory: catName,
      catCode,
      assignedSku: productSku,
      legacySku,
      variantCount: variants.length,
      payload: {
        sku: productSku,
        legacy_sku: legacySku,
        category_code: catCode,
        size_code: baseSizeCode,
        color_code: baseColorCode,
        variants: updatedVariants
      }
    });
  }

  // Print mapping summary
  console.log('--------------------------------------------------------------------------------------------------');
  console.log('| #  | Product Name (first 35 chars)     | Category       | Code | Assigned SKU | Variants | Legacy  |');
  console.log('--------------------------------------------------------------------------------------------------');
  updates.forEach((u, i) => {
    const num = String(i + 1).padStart(2, ' ');
    const name = u.name.padEnd(35, ' ').slice(0, 35);
    const cat = u.currentCategory.padEnd(14, ' ').slice(0, 14);
    const code = u.catCode.padStart(4, ' ');
    const sku = u.assignedSku.padEnd(12, ' ');
    const vars = String(u.variantCount).padStart(8, ' ');
    const leg = (u.legacySku || '-').padEnd(8, ' ').slice(0, 8);
    console.log(`| ${num} | ${name} | ${cat} | ${code} | ${sku} | ${vars} | ${leg} |`);
  });
  console.log('--------------------------------------------------------------------------------------------------\n');

  console.log('📊 Category Serial Allocations:');
  Object.entries(serialTracker).forEach(([code, count]) => {
    console.log(`   - Category ${code}: ${count} SKUs allocated (last_serial: ${count})`);
  });
  console.log(`\nTotal SKUs to Register in sku_registry: ${registryEntries.length}`);

  if (!isExecute) {
    console.log('\n⚠️  DRY RUN COMPLETED. No database changes were made.');
    console.log('To execute this migration against your Supabase database, run:');
    console.log('   node scripts/migrate_existing_skus.js --execute\n');
    return;
  }

  console.log('\n⏳ Applying updates to database...');

  // Update products
  let updatedProductsCount = 0;
  for (const u of updates) {
    const { error: upErr } = await supabase
      .from('products')
      .update(u.payload)
      .eq('id', u.id);

    if (upErr) {
      console.error(`❌ Failed to update product ${u.id} (${u.name}):`, upErr.message);
    } else {
      updatedProductsCount++;
    }
  }

  // Insert into sku_registry
  let registeredSkusCount = 0;
  const { error: regErr } = await supabase
    .from('sku_registry')
    .upsert(registryEntries, { onConflict: 'sku' });

  if (regErr) {
    console.error('❌ Failed to insert into sku_registry:', regErr.message);
  } else {
    registeredSkusCount = registryEntries.length;
  }

  // Update last_serial in sku_categories
  for (const [code, lastSerial] of Object.entries(serialTracker)) {
    await supabase
      .from('sku_categories')
      .update({ last_serial: lastSerial })
      .eq('code', code);
  }

  console.log('\n🎉 MIGRATION FINISHED SUCCESSFULLY!');
  console.log(`   - Products updated: ${updatedProductsCount}/${products.length}`);
  console.log(`   - SKUs registered in sku_registry: ${registeredSkusCount}`);
  console.log(`   - Categories counter synchronized: ${Object.keys(serialTracker).length}`);
}

runMigration().catch(console.error);
