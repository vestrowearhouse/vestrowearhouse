/**
 * Variant Utility Functions
 * Core logic for the product variant engine.
 * These are pure functions — no framework dependencies.
 */

/**
 * Generate all combinations (Cartesian product) from a list of attributes.
 *
 * Input:  [{ name: "Size", values: ["S","M"] }, { name: "Color", values: ["Red","Blue"] }]
 * Output: [{ Size:"S", Color:"Red" }, { Size:"S", Color:"Blue" },
 *          { Size:"M", Color:"Red" }, { Size:"M", Color:"Blue" }]
 *
 * @param {Array<{ name: string, values: string[] }>} attributes
 * @returns {Array<Record<string, string>>}
 */
export function cartesianProduct(attributes) {
  const filtered = attributes.filter(
    (a) => a.name.trim() && a.values.length > 0
  );
  if (filtered.length === 0) return [];

  return filtered.reduce(
    (acc, attr) =>
      acc.flatMap((combo) =>
        attr.values.map((val) => ({ ...combo, [attr.name]: val }))
      ),
    [{}]
  );
}

/**
 * Find the variant that matches the currently selected attributes.
 *
 * @param {Array<Object>} variants   - Full variants array from product
 * @param {Record<string, string>} selectedAttrs - e.g. { Color: "Black", Size: "XL" }
 * @returns {Object|null}
 */
export function findActiveVariant(variants, selectedAttrs) {
  if (!variants?.length || !selectedAttrs) return null;
  const keys = Object.keys(selectedAttrs);
  if (keys.length === 0) return null;

  return (
    variants.find((v) => {
      if (!v.combination) return false;
      return keys.every((k) => {
        const selVal = selectedAttrs[k];
        if (selVal === undefined || selVal === null) return true;
        // Direct match
        if (v.combination[k] !== undefined) {
          return String(v.combination[k]).trim().toLowerCase() === String(selVal).trim().toLowerCase();
        }
        // Case-insensitive key match
        const matchingKey = Object.keys(v.combination).find(
          (ck) => ck.toLowerCase().trim() === k.toLowerCase().trim()
        );
        if (matchingKey) {
          return String(v.combination[matchingKey]).trim().toLowerCase() === String(selVal).trim().toLowerCase();
        }
        return false;
      });
    }) || null
  );
}

/**
 * Generate a random 4-digit STM SKU (e.g. "stm-1042").
 *
 * @param {string} prefix
 * @returns {string}
 */
export function generateStmSku(prefix = 'stm') {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix.toLowerCase()}-${rand}`;
}

/**
 * Generate a default variant SKU adhering to the stm-0000 format.
 * e.g. "stm-1042-m" or "stm-1042-10m"
 *
 * @param {string} productName
 * @param {Record<string, string>} combination
 * @param {string} baseSku
 * @returns {string}
 */
export function generateSku(productName, combination, baseSku = '') {
  let root = baseSku && String(baseSku).trim();
  if (!root || root.toUpperCase().startsWith('STM_PRD') || root.toUpperCase().startsWith('PROD-')) {
    root = generateStmSku('stm');
  } else {
    root = root.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  }

  const attrs = Object.values(combination || {})
    .map((v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 10))
    .filter(Boolean)
    .join('-');

  return attrs ? `${root}-${attrs}` : root;
}

/**
 * Build initial variants array from combinations.
 * Preserves existing variant data (price, stock, images) if they match.
 *
 * @param {Array<Record<string, string>>} combinations
 * @param {Array<Object>} existingVariants
 * @param {string} productName
 * @param {number} basePrice
 * @param {string} baseSku
 * @returns {Array<Object>}
 */
export function buildVariants(combinations, existingVariants = [], productName = '', basePrice = 0, baseSku = '') {
  const rootSku = baseSku && String(baseSku).trim() ? baseSku.trim().toLowerCase() : generateStmSku('stm');

  return combinations.map((combo) => {
    // Try to preserve existing variant data for the same combination
    const existing = existingVariants.find((v) =>
      v.combination &&
      Object.entries(combo).every(([k, val]) => String(v.combination[k]).trim().toLowerCase() === String(val).trim().toLowerCase())
    );

    return {
      sku: existing?.sku || generateSku(productName, combo, rootSku),
      combination: combo,
      price: existing?.price !== undefined && existing?.price !== null ? existing.price : basePrice,
      discountPrice: existing?.discountPrice ?? null,
      stock: existing?.stock !== undefined && existing?.stock !== null ? existing.stock : 10,
      images: existing?.images ?? [],
      status: existing?.status ?? 'active',
    };
  });
}

/**
 * Validate variants before saving.
 * Returns array of error messages (empty = valid).
 */
export function validateVariants(variants) {
  const errors = [];
  const skus = new Set();

  variants.forEach((v, i) => {
    const label = Object.values(v.combination || {}).join(' + ') || `Row ${i + 1}`;
    if (!v.sku?.trim()) {
      errors.push(`${label}: SKU is required`);
    } else if (skus.has(v.sku.trim())) {
      errors.push(`${label}: Duplicate SKU "${v.sku}"`);
    } else {
      skus.add(v.sku.trim());
    }
    if (v.price === '' || v.price === null || v.price === undefined || isNaN(Number(v.price))) {
      errors.push(`${label}: Price is required`);
    }
    if (v.stock === '' || v.stock === null || v.stock === undefined || isNaN(Number(v.stock))) {
      errors.push(`${label}: Stock is required`);
    }
  });

  return errors;
}
