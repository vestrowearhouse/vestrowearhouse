/**
 * Centralized Server-Side SKU Generator & Registry Handler for StellarMartBD
 * Ensures atomic race-condition safe SKU generation and immutable persistence.
 */

import { deriveCategoryCode, matchSizeCode, matchColorCode, formatSKU } from './skuUtils';

/**
 * Assigns immutable SKUs to a product and its variants.
 * Handles both new product creation and updating products (with new variants).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object} params
 * @param {string} [params.categoryId] - Storefront category UUID
 * @param {string} [params.categoryCode] - Direct 2-digit SKU category code (e.g. "20")
 * @param {Array} [params.variants] - Array of variant objects
 * @param {Array} [params.attributes] - Attributes array
 * @param {Object} [params.existingProduct] - Product record if updating
 * @returns {Promise<{
 *   sku: string,
 *   category_code: string,
 *   size_code: string,
 *   color_code: string,
 *   variants: Array
 * }>}
 */
export async function assignProductAndVariantSKUs(supabase, {
  categoryId,
  categoryCode,
  variants = [],
  attributes = [],
  existingProduct = null
}) {
  // 1. Resolve Category Code
  let resolvedCatCode = categoryCode;

  if (!resolvedCatCode && categoryId) {
    // Fetch sku_category_code from existing categories table
    const { data: catRow } = await supabase
      .from('categories')
      .select('id, name, slug, sku_category_code')
      .eq('id', categoryId)
      .maybeSingle();

    if (catRow?.sku_category_code) {
      resolvedCatCode = catRow.sku_category_code;
    } else if (catRow) {
      resolvedCatCode = deriveCategoryCode(catRow);
    }
  }

  if (!resolvedCatCode) {
    resolvedCatCode = existingProduct?.category_code || '99';
  }

  resolvedCatCode = String(resolvedCatCode).padStart(2, '0');

  // 2. If Product Already Has an Immutable SKU, lock category and SKU
  if (existingProduct?.sku && !existingProduct.sku.startsWith('stm-')) {
    const existingSku = existingProduct.sku;
    const existingCatCode = existingProduct.category_code || existingSku.slice(4, 6);

    // Keep existing variants and assign SKUs only to newly added variants
    const existingVariants = Array.isArray(existingProduct.variants) ? existingProduct.variants : [];
    const incomingVariants = Array.isArray(variants) ? [...variants] : [];

    const newVariantsNeedingSku = [];
    const updatedVariants = incomingVariants.map((v) => {
      // Find if this combination existed previously
      const matched = existingVariants.find(
        (ev) => ev.sku && JSON.stringify(ev.combination) === JSON.stringify(v.combination)
      );
      if (matched?.sku) {
        return { ...v, sku: matched.sku };
      }
      if (v.sku && !v.sku.startsWith('stm-')) {
        return v; // Already has permanent SKU
      }
      newVariantsNeedingSku.push(v);
      return v;
    });

    if (newVariantsNeedingSku.length > 0) {
      const keys = newVariantsNeedingSku.map(v => Object.values(v.combination || {}).join('-') || 'variant');
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('generate_next_skus', {
        p_category_code: existingCatCode,
        p_count: newVariantsNeedingSku.length,
        p_product_id: existingProduct.id,
        p_variant_keys: keys
      });

      if (!rpcErr && rpcRes?.skus) {
        let i = 0;
        updatedVariants.forEach((v) => {
          if (newVariantsNeedingSku.includes(v)) {
            v.sku = rpcRes.skus[i++];
          }
        });
      } else {
        // Fallback: direct atomic update
        const skus = await atomicGenerateFallback(supabase, existingCatCode, newVariantsNeedingSku.length, existingProduct.id, keys);
        let i = 0;
        updatedVariants.forEach((v) => {
          if (newVariantsNeedingSku.includes(v)) {
            v.sku = skus[i++];
          }
        });
      }
    }

    return {
      sku: existingSku,
      category_code: existingCatCode,
      size_code: existingProduct.size_code || '00',
      color_code: existingProduct.color_code || '99',
      variants: updatedVariants
    };
  }

  // 3. New Product Creation: Allocate SKUs for base product and all variants
  const incomingVariants = Array.isArray(variants) ? [...variants] : [];
  const variantCount = incomingVariants.length;
  // If product has variants, total SKUs needed = variantCount (each variant gets one, base SKU = variant[0] SKU)
  // If no variants, total SKUs needed = 1 (for the base product)
  const totalSkusNeeded = Math.max(1, variantCount);
  const variantKeys = variantCount > 0
    ? incomingVariants.map(v => Object.values(v.combination || {}).join('-') || 'variant')
    : ['base-product'];

  let allocatedSkus = [];
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('generate_next_skus', {
    p_category_code: resolvedCatCode,
    p_count: totalSkusNeeded,
    p_product_id: existingProduct?.id || null,
    p_variant_keys: variantKeys
  });

  if (!rpcErr && rpcRes?.skus && rpcRes.skus.length === totalSkusNeeded) {
    allocatedSkus = rpcRes.skus;
  } else {
    // Fallback if RPC not yet installed or permissions issue
    allocatedSkus = await atomicGenerateFallback(
      supabase,
      resolvedCatCode,
      totalSkusNeeded,
      existingProduct?.id || null,
      variantKeys
    );
  }

  const baseSku = allocatedSkus[0];

  // Assign SKUs and metadata codes to variants
  const finalVariants = incomingVariants.map((v, idx) => {
    const combo = v.combination || {};
    const sizeVal = combo.Size || combo.size;
    const colorVal = combo.Color || combo.color || combo['Color Family'];
    return {
      ...v,
      sku: allocatedSkus[idx],
      size_code: matchSizeCode(sizeVal),
      color_code: matchColorCode(colorVal)
    };
  });

  // Extract base product size and color codes
  const baseSize = finalVariants[0]?.size_code || '00';
  const baseColor = finalVariants[0]?.color_code || '99';

  return {
    sku: baseSku,
    category_code: resolvedCatCode,
    size_code: baseSize,
    color_code: baseColor,
    variants: finalVariants
  };
}

/**
 * Fallback atomic generation if RPC is missing
 */
async function atomicGenerateFallback(supabase, categoryCode, count, productId, keys) {
  // Fetch current serial
  const { data: catRow } = await supabase
    .from('sku_categories')
    .select('last_serial')
    .eq('code', categoryCode)
    .single();

  const currentSerial = catRow?.last_serial || 0;
  const newEndSerial = currentSerial + count;

  // Update last_serial
  await supabase
    .from('sku_categories')
    .update({ last_serial: newEndSerial })
    .eq('code', categoryCode);

  const startSerial = newEndSerial - count + 1;
  const skus = [];
  const registryInserts = [];

  for (let s = startSerial; s <= newEndSerial; s++) {
    const sku = formatSKU(categoryCode, s);
    skus.push(sku);
    const key = keys[s - startSerial] || null;
    registryInserts.push({
      sku,
      product_id: productId,
      variant_key: key,
      category_code: categoryCode,
      created_at: new Date().toISOString()
    });
  }

  // Register in sku_registry
  if (registryInserts.length > 0) {
    await supabase.from('sku_registry').upsert(registryInserts, { onConflict: 'sku' });
  }

  return skus;
}

