/**
 * Unit Test Script for Sensitive Key Sanitization
 * No DB/network dependencies. Pure logic verification.
 * 
 * Usage:
 *   node scripts/test-sanitize.js
 */

const SENSITIVE_WORDS = new Set([
  'password',
  'passwd',
  'pwd',
  'hash',
  'token',
  'otp',
  'secret',
  'cookie',
  'cvv',
  'pin',
  'authorization',
  'apikey',
  'credential',
  'credentials',
]);

const KEY_PREFIXES = new Set(['api', 'secret', 'private', 'access', 'service', 'encryption']);
const CARD_SUFFIXES = new Set(['number', 'no', 'num']);

function isSensitiveKey(key) {
  if (typeof key !== 'string') return false;

  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\.]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    // 1. Exact single-word match
    if (SENSITIVE_WORDS.has(w)) {
      return true;
    }

    // 2. Compound: ("api"|"secret"|"private"|"access"|"service"|"encryption") + "key"
    if (w === 'key' && i > 0 && KEY_PREFIXES.has(words[i - 1])) {
      return true;
    }

    // 3. Compound: "card" + ("number"|"no"|"num")
    if (w === 'card' && i + 1 < words.length && CARD_SUFFIXES.has(words[i + 1])) {
      return true;
    }
  }

  return false;
}

const MUST_REDACT = [
  'password',
  'passwordHash',
  'password_hash',
  'access_token',
  'refreshToken',
  'apiKey',
  'secret_key',
  'cardNumber',
  'otp',
  'cookie',
  'pin',
  'Authorization',
  'newPassword',
];

const MUST_NOT_REDACT = [
  'shipping',
  'shippingAddress',
  'shipping_cost',
  'author',
  'passed',
  'bypass',
  'keyword',
  'discard',
  'mapping',
  'productKey',
  'status',
  'total',
  'couponCode',
];

console.log('\n======================================================');
console.log('🧪 Testing isSensitiveKey Sanitization Rules');
console.log('======================================================\n');

let failed = 0;

console.log('📋 Group 1: MUST REDACT (Expected: TRUE)');
for (const key of MUST_REDACT) {
  const result = isSensitiveKey(key);
  const status = result === true ? '✅ PASS' : '❌ FAIL';
  if (result !== true) failed++;
  console.log(`  ${status} | Key: "${key}" -> ${result ? 'REDACTED' : 'NOT REDACTED'}`);
}

console.log('\n📋 Group 2: MUST NOT REDACT (Expected: FALSE)');
for (const key of MUST_NOT_REDACT) {
  const result = isSensitiveKey(key);
  const status = result === false ? '✅ PASS' : '❌ FAIL';
  if (result !== false) failed++;
  console.log(`  ${status} | Key: "${key}" -> ${result ? 'REDACTED' : 'NOT REDACTED'}`);
}

console.log('\n======================================================');
if (failed === 0) {
  console.log('✨ ALL 26 TESTS PASSED! Sanitization logic is 100% accurate.');
} else {
  console.error(`💥 ${failed} TESTS FAILED!`);
  process.exit(1);
}
console.log('======================================================\n');
