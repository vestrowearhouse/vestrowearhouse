import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

// GET: single vendor product
export async function GET(request, { params }) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const supabase = getVendorSupabaseClient();
    
    // Check products table first
    let { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('vendor_id', session.vendorId)
      .maybeSingle();

    if (!product) {
      // Fallback to vendor_products table
      const res = await supabase
        .from('vendor_products')
        .select('*')
        .eq('id', params.id)
        .eq('vendor_id', session.vendorId)
        .maybeSingle();
      product = res.data;
    }

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    console.error('Get vendor product error:', err);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PATCH: vendor edits their own product (e.g. stock, price, status)
export async function PATCH(request, { params }) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const supabase = getVendorSupabaseClient();
    const body = await request.json();

    // Strip protected fields
    delete body.vendor_id;
    delete body.id;

    if (body.sellingPrice !== undefined && body.price === undefined) body.price = body.sellingPrice;
    if (body.price !== undefined && body.sellingPrice === undefined) body.sellingPrice = body.price;
    if (body.regularPrice !== undefined && body.original_price === undefined) body.original_price = body.regularPrice;
    if (body.original_price !== undefined && body.regularPrice === undefined) body.regularPrice = body.original_price;
    if (body.regularPrice !== undefined && body.oldPrice === undefined) body.oldPrice = body.regularPrice;
    if (body.stockQuantity !== undefined && body.stock === undefined) body.stock = body.stockQuantity;
    if (body.stock !== undefined && body.stockQuantity === undefined) body.stockQuantity = body.stock;
    if (body.sku === '') body.sku = null;
    if (body.isActive !== undefined && body.status === undefined) {
      body.status = body.isActive ? 'active' : 'inactive';
    }

    // Check if exists in products table
    const { data: inProducts } = await supabase
      .from('products')
      .select('id')
      .eq('id', params.id)
      .eq('vendor_id', session.vendorId)
      .maybeSingle();

    let targetTable = inProducts ? 'products' : 'vendor_products';

    const { data: updated, error: upErr } = await supabase
      .from(targetTable)
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('vendor_id', session.vendorId)
      .select()
      .maybeSingle();

    if (upErr) throw upErr;
    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error('Edit vendor product error:', err);
    return NextResponse.json({ error: 'Failed to update product: ' + err.message }, { status: 500 });
  }
}

export const PUT = PATCH;

// DELETE: vendor deletes their own product
export async function DELETE(request, { params }) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const supabase = getVendorSupabaseClient();

    // Check in products first
    const { data: inProducts } = await supabase
      .from('products')
      .select('id')
      .eq('id', params.id)
      .eq('vendor_id', session.vendorId)
      .maybeSingle();

    const targetTable = inProducts ? 'products' : 'vendor_products';

    const { error: delErr } = await supabase
      .from(targetTable)
      .delete()
      .eq('id', params.id)
      .eq('vendor_id', session.vendorId);

    if (delErr) throw delErr;
    return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete vendor product error:', err);
    return NextResponse.json({ error: 'Failed to delete product: ' + err.message }, { status: 500 });
  }
}
