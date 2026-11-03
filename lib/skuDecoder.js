/**
 * SKU Decoder & Validation Engine for StellarMartBD
 * Format: "SMBD" + 2-digit category code + 4+ digit serial
 * Example: "SMBD200001" -> Category 20 (T-Shirt), Serial 0001
 */

export const SKU_REGEX = /^SMBD(\d{2})(\d{4,})$/;

/**
 * Validates whether a given string is a valid StellarMartBD SKU.
 * Format: "SMBD" + 2-digit category code + 4+ digit serial (uppercase only, no spaces or dashes)
 * @param {string} sku
 * @returns {boolean}
 */
export function isValidSKU(sku) {
  if (!sku || typeof sku !== 'string') return false;
  // Strictly uppercase only: do not auto-convert lowercase
  return SKU_REGEX.test(sku.trim());
}

/**
 * Decodes a StellarMartBD SKU into its constituent metadata.
 *
 * @param {string} sku - The SKU string to decode
 * @param {Record<string, { name: string, group?: string, group_name?: string, groupName?: string }>} [categoriesMap] - Optional map of category codes to category info
 * @returns {{
 *   valid: boolean,
 *   sku?: string,
 *   categoryCode?: string,
 *   categoryName?: string,
 *   groupName?: string,
 *   serial?: number,
 *   serialFormatted?: string,
 *   error?: string
 * }}
 */
export function decodeSKU(sku, categoriesMap = {}) {
  if (!sku || typeof sku !== 'string') {
    return { valid: false, error: 'SKU is required and must be a string' };
  }

  const cleanSku = sku.trim();
  const match = cleanSku.match(SKU_REGEX);

  if (!match) {
    return {
      valid: false,
      sku: cleanSku,
      error: 'Invalid SKU format. Must match ^SMBD\\d{6,}$ (uppercase only, e.g. SMBD200001)'
    };
  }

  const categoryCode = match[1];
  const serialRaw = match[2];
  const serial = parseInt(serialRaw, 10);

  const categoryInfo = categoriesMap[categoryCode] || null;

  return {
    valid: true,
    sku: cleanSku,
    categoryCode,
    serial,
    serialFormatted: serialRaw,
    categoryName: categoryInfo?.name || null,
    groupName: categoryInfo?.group_name || categoryInfo?.group || categoryInfo?.groupName || null
  };
}

/**
 * Format a SKU given a 2-digit category code and integer serial.
 * Auto-pads to 4 digits (e.g. 1 -> "0001"), or 5+ digits if > 9999.
 *
 * @param {string|number} categoryCode
 * @param {number} serial
 * @returns {string}
 */
export function formatSKU(categoryCode, serial) {
  const cat = String(categoryCode).padStart(2, '0');
  const num = parseInt(serial, 10);
  if (isNaN(num) || num < 1) {
    throw new Error('Serial must be a positive integer');
  }

  const serialStr = num < 10000 ? String(num).padStart(4, '0') : String(num);
  return `SMBD${cat}${serialStr}`;
}

