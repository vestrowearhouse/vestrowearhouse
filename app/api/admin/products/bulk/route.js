import { NextResponse } from 'next/server';
import { checkAdminAccess, ROLES } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { clearCache, clearCacheByPrefix } from '@/lib/api-cache';
import { revalidatePath } from 'next/cache';
import { updateProductEmbedding } from '@/lib/ai-embeddings';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { adminSupabase } from '@/lib/dbExplorer';
import { assignProductAndVariantSKUs } from '@/lib/skuServer';

export const dynamic = 'force-dynamic';

function createSlug(name) {
  const base = (name || 'product')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  const prefix = base || 'prod';
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function POST(request) {
  try {
    const auth = await checkAdminAccess([ROLES.SUPER_ADMIN, ROLES.EDITOR]);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const rawItems = Array.isArray(body) ? body : (body.products || body.items || []);

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ error: 'No product data provided. Please provide an array of products.' }, { status: 400 });
    }

    if (rawItems.length > 1000) {
      return NextResponse.json({ error: 'Max 1000 products allowed per bulk batch.' }, { status: 400 });
    }

    const supabase = adminSupabase;

    // Fetch existing categories for mapping and slug/name resolution
    let categoryMap = new Map();
    try {
      const { data: allCats } = await supabase.from('categories').select('id, name, slug');
      if (allCats) {
        allCats.forEach(c => {
          if (c.id) categoryMap.set(c.id.toLowerCase(), c.id);
          if (c.slug) categoryMap.set(c.slug.toLowerCase(), c.id);
          if (c.name) categoryMap.set(c.name.trim().toLowerCase(), c.id);
        });
      }
    } catch (catErr) {
      console.warn('Could not fetch categories for mapping:', catErr);
    }

    const validProducts = [];
    const validationErrors = [];

    for (let index = 0; index < rawItems.length; index++) {
      const item = rawItems[index];
      const rowIndex = index + 1;

      if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
        validationErrors.push({ row: rowIndex, item, reason: 'Product name is required' });
        continue;
      }

      const name = item.name.trim();
      const nameBn = (item.nameBn || item.name_bn || '').trim() || null;
      
      // Parse prices
      const rawSelling = item.sellingPrice !== undefined ? item.sellingPrice : (item.price !== undefined ? item.price : item.regularPrice);
      const rawRegular = item.regularPrice !== undefined ? item.regularPrice : (item.oldPrice !== undefined ? item.oldPrice : rawSelling);

      const sellingPrice = parseFloat(rawSelling);
      const regularPrice = parseFloat(rawRegular);

      if (isNaN(sellingPrice) || sellingPrice < 0) {
        validationErrors.push({ row: rowIndex, item, reason: 'Invalid or missing selling price' });
        continue;
      }

      // Stock
      const rawStock = item.stockQuantity !== undefined ? item.stockQuantity : (item.stock !== undefined ? item.stock : 0);
      const stockQuantity = Math.max(0, parseInt(rawStock) || 0);

      // Category resolution
      let categoryId = null;
      if (item.category) {
        const catStr = String(item.category).trim();
        const matched = categoryMap.get(catStr.toLowerCase());
        categoryId = matched || catStr;
      }

      // Images formatting & automatic Cloudinary upload for base64
      let rawImages = [];
      if (Array.isArray(item.images)) {
        rawImages = item.images.filter(img => typeof img === 'string' && img.trim().length > 0);
      } else if (typeof item.images === 'string' && item.images.trim()) {
        try {
          const parsed = JSON.parse(item.images);
          if (Array.isArray(parsed)) rawImages = parsed;
          else rawImages = [item.images.trim()];
        } catch {
          if (item.images.startsWith('data:image/')) {
            rawImages = [item.images.trim()];
          } else {
            rawImages = item.images.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
      } else if (item.image && typeof item.image === 'string') {
        rawImages = [item.image.trim()];
      }

      let images = [];
      for (const img of rawImages) {
        if (typeof img === 'string' && img.startsWith('data:')) {
          try {
            const upRes = await uploadToCloudinary(img, { folder: 'stellar-mart/bulk-products' });
            images.push(upRes.url);
          } catch (e) {
            console.error('Failed to upload base64 in bulk:', e);
          }
        } else if (img) {
          images.push(img);
        }
      }

      let featuredImage = item.featuredImage || item.featured_image || (images.length > 0 ? images[0] : null);
      if (typeof featuredImage === 'string' && featuredImage.startsWith('data:')) {
        try {
          const upRes = await uploadToCloudinary(featuredImage, { folder: 'stellar-mart/bulk-products' });
          featuredImage = upRes.url;
        } catch (e) {
          console.error('Failed to upload base64 featuredImage in bulk:', e);
        }
      }

      // Tags formatting
      let tags = [];
      if (Array.isArray(item.tags)) {
        tags = item.tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof item.tags === 'string' && item.tags.trim()) {
        tags = item.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      // Description formatting
      const description = item.description ? String(item.description).trim() : null;
      const descriptionBn = (item.descriptionBn || item.description_bn) ? String(item.descriptionBn || item.description_bn).trim() : null;
      const shortDescription = (item.shortDescription || item.short_description) ? String(item.shortDescription || item.short_description).trim() : null;

      // Generate custom or sanitized slug
      let slug = item.slug ? String(item.slug).trim().toLowerCase().replace(/[^a-z0-9\u0980-\u09FF-]+/g, '-') : '';
      if (!slug) {
        slug = createSlug(name);
      }

      validProducts.push({
        _originalIndex: rowIndex,
        name,
        nameBn,
        slug,
        description,
        descriptionBn,
        shortDescription,
        regularPrice: !isNaN(regularPrice) ? regularPrice : sellingPrice,
        sellingPrice: sellingPrice,
        price: sellingPrice,
        oldPrice: !isNaN(regularPrice) ? regularPrice : sellingPrice,
        stockQuantity,
        stock: stockQuantity,
        stockStatus: stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
        category: categoryId,
        sku: null,
        category_code: null,
        legacy_sku: null,
        brand: item.brand ? String(item.brand).trim() : null,
        tags,
        images,
        featuredImage,
        isFeatured: Boolean(item.isFeatured || item.featured),
        isNewArrival: item.isNewArrival !== undefined ? Boolean(item.isNewArrival) : true,
        isBestSeller: Boolean(item.isBestSeller),
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        attributes: Array.isArray(item.attributes) ? item.attributes : [],
        variants: Array.isArray(item.variants)
          ? item.variants.map(({ sku: _vSku, legacy_sku: _vLeg, ...restVar }) => restVar)
          : []
      });
    }

    if (validProducts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid products could be processed.',
        total: rawItems.length,
        insertedCount: 0,
        failedCount: validationErrors.length,
        errors: validationErrors
      }, { status: 400 });
    }

    // Insert into Supabase in chunks of 50
    const CHUNK_SIZE = 50;
    const successfullyInserted = [];
    const insertionErrors = [...validationErrors];
    const insertedIds = [];

    for (let i = 0; i < validProducts.length; i += CHUNK_SIZE) {
      const chunk = validProducts.slice(i, i + CHUNK_SIZE);
      const readyToInsert = [];

      // Assign standard immutable SKUs and category codes before bulk insertion.
      // Ignore any client-sent sku/category_code/legacy_sku fields.
      // If SKU assignment throws for a product, do NOT insert it; add it to the failed list.
      for (const item of chunk) {
        const { _originalIndex, sku: _ignoredSku, category_code: _ignoredCatCode, legacy_sku: _ignoredLegacySku, ...clean } = item;
        try {
          const processed = await assignProductAndVariantSKUs(clean, true);
          readyToInsert.push({ ...processed, _originalIndex });
        } catch (skuErr) {
          console.error(`SKU assignment failed for row ${_originalIndex} (${item.name}):`, skuErr);
          insertionErrors.push({
            row: _originalIndex,
            name: item.name,
            reason: `SKU assignment failed: ${skuErr.message || 'Unknown SKU error'}`
          });
        }
      }

      if (readyToInsert.length > 0) {
        const cleanInsertChunk = readyToInsert.map(({ _originalIndex, ...clean }) => clean);
        const { data, error } = await supabase
          .from('products')
          .insert(cleanInsertChunk)
          .select('id, name, slug, sku');

        if (!error && data) {
          successfullyInserted.push(...data);
          data.forEach(p => insertedIds.push(p.id));
        } else {
          // Fallback: If chunk insert failed, insert individually to rescue valid items
          for (const singleItem of readyToInsert) {
            const { _originalIndex, ...cleanSingle } = singleItem;
            const { data: singleData, error: singleError } = await supabase
              .from('products')
              .insert([cleanSingle])
              .select('id, name, slug, sku')
              .single();

            if (!singleError && singleData) {
              successfullyInserted.push(singleData);
              insertedIds.push(singleData.id);
            } else {
              insertionErrors.push({
                row: _originalIndex,
                name: singleItem.name,
                sku: singleItem.sku,
                reason: singleError?.message || 'Database insert failed'
              });
            }
          }
        }
      }
    }

    // Background Embedding Generation
    if (insertedIds.length > 0) {
      Promise.all(insertedIds.slice(0, 50).map(id => updateProductEmbedding(id).catch(() => {}))).catch(() => {});
    }

    // Invalidate caches
    try {
      clearCache('home:v1');
      clearCacheByPrefix('products:');
      revalidatePath('/', 'layout');
      revalidatePath('/admin/products');
    } catch (cacheErr) {
      console.warn('Cache revalidation warning:', cacheErr);
    }

    // Activity Log
    logActivity({
      action: 'BULK_CREATE_PRODUCTS',
      description: `Bulk imported ${successfullyInserted.length} products (Errors: ${insertionErrors.length})`,
      req: request
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      total: rawItems.length,
      insertedCount: successfullyInserted.length,
      failedCount: insertionErrors.length,
      inserted: successfullyInserted,
      errors: insertionErrors
    }, { status: 201 });

  } catch (err) {
    console.error('Bulk products POST error:', err);
    return NextResponse.json({
      error: 'An unexpected error occurred during bulk product import: ' + (err.message || 'Unknown error')
    }, { status: 500 });
  }
}
