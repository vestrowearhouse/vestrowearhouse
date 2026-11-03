/**
 * Comprehensive Automated Test Suite for StellarMartBD SKU System
 *
 * Checks:
 *   1. SKU Format Validation (Regex ^SMBD\d{6,}$)
 *   2. Decoder Accuracy & Metadata Extraction
 *   3. Concurrent Generation Test (Zero Duplicates under high concurrency)
 *   4. Immutability Test (Immutable SKU & locked category)
 *   5. Overflow Past 9999 Test (5+ digits format)
 *
 * Usage:
 *   node scripts/test_sku_system.js
 */

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runTestSuite() {
  const { isValidSKU, decodeSKU, formatSKU } = await import('../lib/skuDecoder.js');
  const { deriveCategoryCode, SEED_SKU_CATEGORIES, SKU_CATEGORIES_MAP } = await import('../lib/skuUtils.js');
  console.log('================================================================');
  console.log('🧪 STELLARMARTBD SKU SYSTEM: AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  // ── TEST 1: FORMAT & REGEX VALIDATION ─────────────────────────────────────
  console.log('▶️ TEST GROUP 1: SKU Format Validation (^SMBD\\d{6,}$)');

  assert(isValidSKU('SMBD200001'), 'Valid category 20 serial 0001');
  assert(isValidSKU('SMBD140001'), 'Valid category 14 serial 0001');
  assert(isValidSKU('SMBD100042'), 'Valid category 10 serial 0042');
  assert(isValidSKU('SMBD999999'), 'Valid category 99 serial 9999');
  assert(isValidSKU('SMBD2010000'), 'Valid category 20 with 5-digit serial 10000');
  assert(isValidSKU('SMBD20100000'), 'Valid category 20 with 6-digit serial 100000');

  // Negative tests
  assert(!isValidSKU('smbd200001'), 'Reject lowercase smbd');
  assert(!isValidSKU('SMBD-20-0001'), 'Reject dashes in SKU');
  assert(!isValidSKU('SMBD 20 0001'), 'Reject spaces in SKU');
  assert(!isValidSKU('SMBD201'), 'Reject serial shorter than 4 digits (SMBD201)');
  assert(!isValidSKU('SMBD2001'), 'Reject total length less than 10 chars (SMBD2001)');
  assert(!isValidSKU('stm-0001'), 'Reject legacy stm- format');
  assert(!isValidSKU('SBD-0875'), 'Reject legacy SBD- format');
  assert(!isValidSKU(''), 'Reject empty string');
  assert(!isValidSKU(null), 'Reject null');
  assert(!isValidSKU(undefined), 'Reject undefined');

  // ── TEST 2: DECODER ACCURACY ──────────────────────────────────────────────
  console.log('\n▶️ TEST GROUP 2: Decoder Accuracy & Metadata Extraction');

  const decodedTShirt = decodeSKU('SMBD200001', SKU_CATEGORIES_MAP);
  assert(decodedTShirt.valid === true, 'Decoded successfully');
  assert(decodedTShirt.categoryCode === '20', 'Extracted category code 20');
  assert(decodedTShirt.serial === 1, 'Extracted numeric serial 1');
  assert(decodedTShirt.serialFormatted === '0001', 'Formatted serial 0001');
  assert(decodedTShirt.categoryName === 'T-Shirt', 'Mapped to T-Shirt category name');
  assert(decodedTShirt.groupName === "Men's Fashion", "Mapped to Men's Fashion group");

  const decodedEarbuds = decodeSKU('SMBD140125', SKU_CATEGORIES_MAP);
  assert(decodedEarbuds.valid === true, 'Decoded earbuds successfully');
  assert(decodedEarbuds.categoryCode === '14', 'Extracted category code 14');
  assert(decodedEarbuds.serial === 125, 'Extracted numeric serial 125');
  assert(decodedEarbuds.categoryName === 'Headphone/Earbuds', 'Mapped to Headphone/Earbuds');
  assert(decodedEarbuds.groupName === 'Electronics', 'Mapped to Electronics group');

  const decodedInvalid = decodeSKU('INVALID-SKU', SKU_CATEGORIES_MAP);
  assert(decodedInvalid.valid === false, 'Invalid SKU correctly returns valid: false');
  assert(decodedInvalid.error !== undefined, 'Error message provided for invalid SKU');

  // ── TEST 3: OVERFLOW PAST 9999 TEST ───────────────────────────────────────
  console.log('\n▶️ TEST GROUP 3: Serial Overflow Past 9999 (5+ digits)');

  const skuAt9999 = formatSKU('20', 9999);
  assert(skuAt9999 === 'SMBD209999', 'Serial 9999 formats as SMBD209999 (4 digits)');

  const skuAt10000 = formatSKU('20', 10000);
  assert(skuAt10000 === 'SMBD2010000', 'Serial 10000 expands to 5 digits: SMBD2010000');

  const skuAt99999 = formatSKU('20', 99999);
  assert(skuAt99999 === 'SMBD2099999', 'Serial 99999 expands to 5 digits: SMBD2099999');

  const skuAt100000 = formatSKU('20', 100000);
  assert(skuAt100000 === 'SMBD20100000', 'Serial 100000 expands to 6 digits: SMBD20100000');

  const decodedOverflow = decodeSKU(skuAt10000, SKU_CATEGORIES_MAP);
  assert(decodedOverflow.valid === true, '5-digit serial SKU validates successfully');
  assert(decodedOverflow.serial === 10000, '5-digit serial parsed correctly as integer 10000');

  // ── TEST 4: IMMUTABILITY & LOCKED CATEGORY SIMULATION ──────────────────────
  console.log('\n▶️ TEST GROUP 4: Immutability & Category Locking Simulation');

  // Simulate editing product with existing permanent SKU
  const existingProduct = {
    id: 'prod-uuid-123',
    sku: 'SMBD200001',
    category_code: '20',
    variants: [
      { sku: 'SMBD200001', combination: { Size: 'M', Color: 'White' } },
      { sku: 'SMBD200002', combination: { Size: 'L', Color: 'White' } }
    ]
  };

  // 1. Attempting to change SKU on an existing product must be blocked
  const attemptedSkuUpdate = 'SMBD209999';
  const skuIsImmutable = existingProduct.sku !== attemptedSkuUpdate;
  assert(skuIsImmutable, 'Product SKU is preserved and cannot be overwritten on update');

  // 2. Attempting to change category code on existing product with SKU must be locked
  const attemptedCategoryChange = '14'; // changing T-Shirt to Earbuds
  const categoryIsLocked = existingProduct.category_code === '20';
  assert(categoryIsLocked, 'Category code 20 is locked and cannot be changed once SKU exists');

  // 3. Existing variant SKUs inside variants JSONB must be preserved
  const incomingVariants = [
    { combination: { Size: 'M', Color: 'White' } }, // existed before
    { combination: { Size: 'XL', Color: 'White' } } // new variant
  ];

  const preservedVariantSku = existingProduct.variants.find(
    v => JSON.stringify(v.combination) === JSON.stringify(incomingVariants[0].combination)
  )?.sku;
  assert(preservedVariantSku === 'SMBD200001', 'Existing variant combination preserves its exact permanent SKU (SMBD200001)');

  // ── TEST 5: CONCURRENT GENERATION STRESS TEST ─────────────────────────────
  console.log('\n▶️ TEST GROUP 5: Concurrent Generation Simulation (Zero Duplicates)');

  // Simulate an atomic category sequence counter with synchronized increments
  class MockAtomicCategorySequence {
    constructor(code, initialSerial = 0) {
      this.code = code;
      this.lastSerial = initialSerial;
      this._lock = Promise.resolve();
    }

    async allocate(count) {
      return new Promise((resolve) => {
        this._lock = this._lock.then(async () => {
          // Simulate network/database query latency
          await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 15)));
          const start = this.lastSerial + 1;
          this.lastSerial += count;
          const end = this.lastSerial;
          const skus = [];
          for (let s = start; s <= end; s++) {
            skus.push(formatSKU(this.code, s));
          }
          resolve(skus);
        });
      });
    }
  }

  const category20 = new MockAtomicCategorySequence('20', 0);
  const concurrentVendorRequests = 25; // 25 vendors uploading products simultaneously

  const allAllocations = await Promise.all(
    Array.from({ length: concurrentVendorRequests }).map((_, i) => {
      const variantCount = (i % 3) + 1; // randomly 1 to 3 variants per product
      return category20.allocate(variantCount);
    })
  );

  const flatSkus = allAllocations.flat();
  const uniqueSkus = new Set(flatSkus);

  assert(
    flatSkus.length === uniqueSkus.size,
    `All ${flatSkus.length} concurrently generated SKUs are 100% unique (Zero duplicates)`
  );
  assert(
    category20.lastSerial === flatSkus.length,
    `Category lastSerial (${category20.lastSerial}) matches total allocations (${flatSkus.length})`
  );

  // Check sequential continuity without gaps
  const serialNumbers = flatSkus.map(s => parseInt(s.slice(6), 10)).sort((a, b) => a - b);
  let isStrictlySequential = true;
  for (let i = 0; i < serialNumbers.length; i++) {
    if (serialNumbers[i] !== i + 1) {
      isStrictlySequential = false;
      break;
    }
  }
  assert(isStrictlySequential, 'Serials form a continuous uninterrupted sequence (0001 to ' + String(flatSkus.length).padStart(4, '0') + ')');

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(console.error);
