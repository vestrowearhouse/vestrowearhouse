import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET: single vendor product (admin view)
export async function GET(request, { params }) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('vendor_products')
    .select('*, vendors(id, shop_name, owner_name, email)')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json({ product: data });
}

// POST: approve or reject a vendor product
export async function POST(request, { params }) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json().catch(() => ({}));
  const action = body.action;      // 'approve' | 'reject'
  const admin_note = body.admin_note || null;

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject".' }, { status: 400 });
  }

  // Load the product with all fields to allow copying
  const { data: product, error: fetchErr } = await supabase
    .from('vendor_products')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  if (product.approval_status === 'approved' && action === 'approve') {
    return NextResponse.json({ error: 'Product is already approved' }, { status: 409 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  // Update approval_status on vendor_products
  const { error: updateErr } = await supabase
    .from('vendor_products')
    .update({ approval_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateErr) {
    console.error('Approval update error:', updateErr);
    return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
  }

  // Synchronize with main products table
  try {
    if (action === 'approve') {
      const productData = {
        id: product.id,
        name: product.name,
        nameBn: product.name_bn || null,
        slug: product.slug,
        description: product.description || null,
        descriptionBn: product.description_bn || null,
        shortDescription: product.short_description || null,
        price: Number(product.price),
        sellingPrice: Number(product.price),
        regularPrice: Number(product.original_price || product.price),
        oldPrice: Number(product.original_price || product.price),
        original_price: Number(product.original_price || product.price),
        category: product.category,
        images: product.images || [],
        featuredImage: product.featured_image || null,
        stock: parseInt(product.stock) || 0,
        stockQuantity: parseInt(product.stock) || 0,
        sku: product.sku || null,
        vendor_id: product.vendor_id,
        status: 'active',
        isActive: true,
        featured: product.is_featured || false,
        isFeatured: product.is_featured || false,
        isNewArrival: product.is_new_arrival || false,
        isBestSeller: product.is_best_seller || false,
        tags: product.tags || [],
        brand: product.brand || null,
        approval_status: 'approved',
        stockStatus: (parseInt(product.stock) || 0) > 0 ? 'in_stock' : 'out_of_stock',
        updated_at: new Date().toISOString()
      };

      // Generate vector embedding
      try {
        const { generateProductEmbedding } = require('@/lib/ai-embeddings');
        const embedding = await generateProductEmbedding(productData);
        if (embedding) {
          productData.embedding = embedding;
        }
      } catch (embErr) {
        console.error('Failed to generate embedding during vendor product approval:', embErr);
      }

      const { error: upsertErr } = await supabase
        .from('products')
        .upsert(productData);

      if (upsertErr) {
        console.error('Error syncing to products table:', upsertErr.message);
      }
    } else if (action === 'reject') {
      // Delete from main products table if rejected or revoked
      const { error: delErr } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (delErr) {
        console.error('Error deleting from main products table on rejection:', delErr.message);
      }
    }
  } catch (syncErr) {
    console.error('Exception in vendor product catalog synchronization:', syncErr);
  }

  // Send notification to vendor (non-critical)
  try {
    await supabase.from('vendor_notifications').insert({
      vendor_id: product.vendor_id,
      type: action === 'approve' ? 'product_approved' : 'product_rejected',
      payload: {
        vendor_product_id: id,
        product_name: product.name,
        admin_note,
      },
    });
  } catch (notifErr) {
    console.warn('Vendor notification failed (non-critical):', notifErr?.message);
  }

  return NextResponse.json({
    success: true,
    message: `Product ${newStatus} successfully synced with customer catalog.`,
    approval_status: newStatus,
  });
}
