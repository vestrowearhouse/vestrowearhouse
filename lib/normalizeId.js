/**
 * Normalizes an ID or product object into a clean, trimmed string.
 * Ensures consistent comparison across Number, String, UUID, and Object shapes.
 */
export function normalizeId(input) {
  if (input === null || input === undefined) return '';
  if (typeof input === 'object') {
    const raw = input.id || input._id || input.productId || '';
    return raw ? String(raw).trim() : '';
  }
  return String(input).trim();
}

export default normalizeId;
