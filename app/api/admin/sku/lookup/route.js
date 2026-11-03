import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkAdminAccess } from '@/lib/auth';
import { decodeSKU } from '@/lib/skuDecoder';
import { SKU_CATEGORIES_MAP } from '@/lib/skuUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const adminAuth = await checkAdminAccess(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const { searchParams } = new URL(request.url);
    const skuParam = searchParams.get('sku')?.trim().toUpperCase();

    if (!skuParam) {
      return NextResponse.json({ error: 'SKU query parameter is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Check decode validation
    const decoded = decodeSKU(skuParam, SKU_CATEGORIES_MAP);

    // 2. Query sku_registry first
    const { data: registryItem } = await supabase
      .from('sku_registry')
      .select('sku, product_id, variant_key, category_code, created_at')
      .eq('sku', skuParam)
      .maybeSingle();

    // 3. Query product record
    let product = null;
    if (registryItem?.product_id) {
      const { data: p } = await supabase
        .from('products')
        .select('id, name, slug, price, sellingPrice, regularPrice, stock, stockQuantity, vendor_id, status, isActive, featuredImage, images, category, attributes, variants')
        .eq('id', registryItem.product_id)
        .maybeSingle();
      product = p;
    } else {
      // Fallback: search products directly by sku or variants JSONB
      const { data: pDirect } = await supabase
        .from('products')
        .select('id, name, slug, price, sellingPrice, regularPrice, stock, stockQuantity, vendor_id, status, isActive, featuredImage, images, category, attributes, variants')
        .eq('sku', skuParam)
        .maybeSingle();
      product = pDirect;

      if (!product) {
        // Search inside variants JSONB
        const { data: pVariant } = await supabase
          .from('products')
          .select('id, name, slug, price, sellingPrice, regularPrice, stock, stockQuantity, vendor_id, status, isActive, featuredImage, images, category, attributes, variants')
          .filter('variants', 'cs', JSON.stringify([{ sku: skuParam }]))
          .maybeSingle();
        product = pVariant;
      }
    }

    if (!product && !registryItem) {
      return NextResponse.json({
        found: false,
        sku: skuParam,
        decoded: decoded.valid ? decoded : null,
        message: 'No product or variant found matching this SKU in the database.'
      }, { status: 404 });
    }

    // 4. Fetch vendor info
    let vendorInfo = { id: product?.vendor_id || null, name: 'StellarMart Direct', shop_name: 'StellarMart Official' };
    if (product?.vendor_id) {
      const { data: v } = await supabase
        .from('vendors')
        .select('id, shop_name, user_id, status')
        .eq('id', product.vendor_id)
        .maybeSingle();
      if (v) {
        vendorInfo = { id: v.id, shop_name: v.shop_name || 'Official Vendor' };
      }
    }

    // 5. Determine if variant SKU
    let isVariant = Boolean(registryItem?.variant_key);
    let matchedVariant = null;

    if (product?.variants && Array.isArray(product.variants)) {
      matchedVariant = product.variants.find(v => v.sku?.toUpperCase() === skuParam);
      if (matchedVariant) isVariant = true;
    }

    // Stock & Pricing resolution
    const finalStock = matchedVariant
      ? (matchedVariant.stock ?? product?.stockQuantity ?? product?.stock ?? 0)
      : (product?.stockQuantity ?? product?.stock ?? 0);

    const finalPrice = matchedVariant
      ? (matchedVariant.price || product?.sellingPrice || product?.price || 0)
      : (product?.sellingPrice || product?.price || 0);

    // Extract attributes (Size, Color)
    const combo = matchedVariant?.combination || {};
    const sizeVal = combo.Size || combo.size || (product?.sizes && product.sizes[0]) || '-';
    const colorVal = combo.Color || combo.color || combo['Color Family'] || (product?.colors && product.colors[0]) || '-';

    return NextResponse.json({
      found: true,
      sku: skuParam,
      decoded: {
        categoryCode: decoded.categoryCode || registryItem?.category_code,
        categoryName: decoded.categoryName || SKU_CATEGORIES_MAP[registryItem?.category_code]?.name || 'Unknown',
        groupName: decoded.groupName || SKU_CATEGORIES_MAP[registryItem?.category_code]?.group || 'General',
        serial: decoded.serial,
        serialFormatted: decoded.serialFormatted,
      },
      product: product ? {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.featuredImage || product.images?.[0] || null,
        baseSku: product.sku,
        status: product.status || (product.isActive ? 'active' : 'inactive'),
        stock: finalStock,
        price: finalPrice,
      } : null,
      isVariant,
      variantKey: registryItem?.variant_key || (matchedVariant ? Object.values(combo).join(' / ') : null),
      combination: combo,
      size: sizeVal,
      color: colorVal,
      vendor: vendorInfo,
      registeredAt: registryItem?.created_at || product?.created_at || null
    });
  } catch (error) {
    console.error('Admin SKU lookup error:', error);
    return NextResponse.json({ error: 'Internal server error while looking up SKU' }, { status: 500 });
  }
}

