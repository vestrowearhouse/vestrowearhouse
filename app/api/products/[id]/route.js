import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { assignProductAndVariantSKUs } from '@/lib/skuServer';

// Lazy initialize Supabase client
const getSupabaseClient = () => {
  return getSupabaseAdmin();
};

// Helper function to verify admin token
// GET handler for fetching a single product by ID
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const supabase = getSupabaseClient();
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    const isAdmin = adminToken ? verifyAdminToken(request) : false;

    let queryBuilder = supabase
      .from('products')
      .select('*')
      .eq('id', id);

    // Non-admin users should only see active products
    if (!isAdmin) {
      queryBuilder = queryBuilder.or('"isActive".eq.true,"isActive".is.null');
    }

    const { data, error } = await queryBuilder.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let product = data;
    if (product.vendor_id) {
      try {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id, user_id, shop_name, owner_name, shop_address, logo_url, is_verified, verification_badge')
          .or(`id.eq.${product.vendor_id},user_id.eq.${product.vendor_id}`)
          .maybeSingle();
        if (vendorData) {
          product = {
            ...product,
            store_name: vendorData.shop_name,
            vendor_logo: vendorData.logo_url,
            is_official: false,
            vendor: {
              ...vendorData,
              is_official: false,
              rating: 4.8,
              total_reviews: 24,
              response_rate: '98%',
              on_time_delivery: '99%'
            }
          };
        } else {
          product = {
            ...product,
            store_name: 'Vendor Store',
            vendor_logo: null,
            is_official: false,
            vendor: {
              id: product.vendor_id,
              shop_name: 'Vendor Store',
              logo_url: null,
              is_official: false,
              is_verified: false
            }
          };
        }
      } catch (err) {
        console.error('Error fetching vendor in single product API:', err);
      }
    }

    if (!product.vendor && !product.vendor_id) {
      product = {
        ...product,
        store_name: 'StellarMart Official',
        is_official: true,
        vendor: {
          id: 'official',
          shop_name: 'StellarMart Official',
          owner_name: 'StellarMart',
          logo_url: '/stellar-logo-mark.png',
          is_verified: true,
          verification_badge: 'Official Mall',
          is_official: true,
          rating: 4.9,
          total_reviews: 1250,
          shop_address: 'Dhaka, Bangladesh (Official Warehouse)',
          response_rate: '100%',
          on_time_delivery: '99.9%',
          fulfilled_by: 'Stellar Direct'
        }
      };
    }

    return NextResponse.json({ product });

  } catch (error) {
    console.error(`Fetch product error (ID: ${id}):`, error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}



// PUT handler for updating a product
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const data = await request.json();

    // Fetch existing product to preserve immutable SKU and lock category if already assigned
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, sku, category, category_code, size_code, color_code, variants')
      .eq('id', id)
      .maybeSingle();

    // Process variant SKUs and maintain immutability
    let finalSku = existingProduct?.sku || data.sku || null;
    let finalCategoryCode = existingProduct?.category_code || data.category_code || null;
    let finalSizeCode = existingProduct?.size_code || data.size_code || null;
    let finalColorCode = existingProduct?.color_code || data.color_code || null;
    let finalVariants = Array.isArray(data.variants) ? data.variants : (existingProduct?.variants || []);

    if (existingProduct) {
      try {
        const skuAssignment = await assignProductAndVariantSKUs(supabase, {
          categoryId: existingProduct.category || data.category,
          categoryCode: existingProduct.category_code || data.category_code,
          variants: finalVariants,
          attributes: data.attributes,
          existingProduct
        });
        finalSku = skuAssignment.sku;
        finalCategoryCode = skuAssignment.category_code;
        finalSizeCode = skuAssignment.size_code;
        finalColorCode = skuAssignment.color_code;
        finalVariants = skuAssignment.variants;
      } catch (skuErr) {
        console.error('Update SKU assignment warning:', skuErr);
      }
    }

    // Construct strict payload to match DB schema
    const updateData = {
      name: data.name,
      nameBn: data.nameBn || null,
      description: data.description || null,
      descriptionBn: data.descriptionBn || null,
      shortDescription: data.shortDescription || null,
      regularPrice: data.oldPrice || data.regularPrice || 0,
      sellingPrice: data.price || data.sellingPrice || 0,
      price: data.price || data.sellingPrice || 0,
      oldPrice: data.oldPrice || data.regularPrice || 0,
      stockQuantity: data.stock || data.stockQuantity || 0,
      stock: data.stock || data.stockQuantity || 0,
      category: existingProduct?.sku ? existingProduct.category : (data.category && data.category !== '' ? data.category : null),
      category_code: finalCategoryCode,
      size_code: finalSizeCode,
      color_code: finalColorCode,
      sku: finalSku,
      brand: data.brand || null,
      tags: data.tags || [],
      images: data.images || [],
      featuredImage: data.featuredImage || null,
      isFeatured: data.isFeatured || false,
      isNewArrival: data.isNewArrival || false,
      isBestSeller: data.isBestSeller || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      // ── Variant engine fields ──
      attributes: Array.isArray(data.attributes) ? data.attributes : [],
      variants: finalVariants,
      ...(data.sold_count !== undefined && !isNaN(Number(data.sold_count)) ? { sold_count: Math.max(0, Number(data.sold_count)) } : {}),
      ...(data.rating !== undefined && !isNaN(Number(data.rating)) ? { rating: Math.min(5, Math.max(0, Number(data.rating))) } : {}),
      ...(data.review_count !== undefined && !isNaN(Number(data.review_count)) ? { review_count: Math.max(0, Number(data.review_count)) } : {}),
      updated_at: new Date().toISOString(),
    };

    if (data.vendor_id !== undefined) {
      updateData.vendor_id = (data.vendor_id === '' || data.vendor_id === 'official') ? null : data.vendor_id;
    }


    // Calculate discount and stock status
    if (updateData.oldPrice && updateData.price) {
      updateData.discountPercent = Math.round(((updateData.oldPrice - updateData.price) / updateData.oldPrice) * 100);
    }
    updateData.stockStatus = updateData.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('slug')
      .single();

    if (error) throw error;
    if (!updatedProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Non-blocking embedding generation in background
    try {
      const { updateProductEmbedding } = require('@/lib/ai-embeddings');
      updateProductEmbedding(id).catch(() => {});
    } catch (embErr) {}

    // Invalidate caches & revalidate once
    try {
      const { clearCache, clearCacheByPrefix } = require('@/lib/api-cache');
      clearCache('home:v1');
      clearCacheByPrefix('products:');
      revalidatePath('/', 'layout');
      revalidatePath('/');
      try { revalidateTag('homepage-data'); } catch (tErr) {}
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr);
    }

    return NextResponse.json({ message: 'Product updated successfully', product: { ...updatedProduct, _id: id } });

  } catch (error) {
    console.error(`Update product error (ID: ${id}):`, error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// PATCH handler for quick toggling (isFeatured, isNewArrival, isBestSeller, isActive)
export async function PATCH(request, { params }) {
  const { id } = params;

  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const data = await request.json();

    const allowedFlags = ['isFeatured', 'isNewArrival', 'isBestSeller', 'isActive'];
    const updateData = { updated_at: new Date().toISOString() };

    let hasChanges = false;
    for (const flag of allowedFlags) {
      if (data[flag] !== undefined) {
        updateData[flag] = Boolean(data[flag]);
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return NextResponse.json({ error: 'No valid status fields provided to update' }, { status: 400 });
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('id, name, isFeatured, isNewArrival, isBestSeller, isActive')
      .single();

    if (error) throw error;
    if (!updatedProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Invalidate caches immediately
    try {
      const { clearCache, clearCacheByPrefix } = require('@/lib/api-cache');
      clearCache('home:v1');
      clearCacheByPrefix('products:');
      revalidatePath('/', 'layout');
      revalidatePath('/');
      try { revalidateTag('homepage-data'); } catch (tErr) {}
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Product status updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error(`Toggle product status error (ID: ${id}):`, error);
    return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
  }
}

// DELETE handler for deleting a product
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw error;

    // Invalidate caches & single-pass layout revalidation
    try {
      const { clearCache, clearCacheByPrefix } = require('@/lib/api-cache');
      clearCache('home:v1');
      clearCacheByPrefix('products:');
      revalidatePath('/', 'layout');
    } catch (e) {
      console.warn('Revalidate error:', e);
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error(`Delete product error (ID: ${id}):`, error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}