import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// Generate URL-safe slug from product name
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

// GET: list this vendor's products from the products table
export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const supabase = getVendorSupabaseClient();
    const vendorIds = [session.userId, session.vendorId].filter(Boolean);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('vendor_id', vendorIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ products: data || [] });
  } catch (err) {
    console.error('Vendor products fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: vendor publishes a product directly into products
export async function POST(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const body = await request.json();

    // Check if batch insert
    if (body.products && Array.isArray(body.products)) {
      const supabase = getVendorSupabaseClient();
      const insertItems = await Promise.all(
        body.products.map(async (p) => {
          let featImg = p.featuredImage || p.image || (Array.isArray(p.images) ? p.images[0] : '') || '';
          if (featImg && typeof featImg === 'string' && featImg.startsWith('data:')) {
            try {
              const res = await uploadToCloudinary(featImg, 'stellar-mart/products');
              featImg = res.secure_url || res.url;
            } catch (err) {
              console.error('Failed to upload batch vendor featuredImage:', err);
            }
          }

          let imgArr = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
          if (imgArr.some(img => typeof img === 'string' && img.startsWith('data:'))) {
            imgArr = await Promise.all(
              imgArr.map(async (img) => {
                if (typeof img === 'string' && img.startsWith('data:')) {
                  try {
                    const res = await uploadToCloudinary(img, 'stellar-mart/products');
                    return res.secure_url || res.url;
                  } catch (err) {
                    return img;
                  }
                }
                return img;
              })
            );
          }

          return {
            vendor_id: session.userId || session.vendorId,
            name: (p.name || p.title || '').trim(),
            nameBn: p.nameBn?.trim() || '',
            slug: generateSlug(p.name || p.title || 'product'),
            description: p.description?.trim() || '',
            descriptionBn: p.descriptionBn?.trim() || '',
            shortDescription: p.shortDescription?.trim() || '',
            price: parseFloat(p.price) || 0,
            sellingPrice: parseFloat(p.price) || 0,
            regularPrice: parseFloat(p.original_price || p.regularPrice) || parseFloat(p.price) || 0,
            original_price: parseFloat(p.original_price || p.regularPrice) || parseFloat(p.price) || 0,
            oldPrice: parseFloat(p.original_price || p.regularPrice) || parseFloat(p.price) || 0,
            sku: p.sku?.trim() || '',
            stock: parseInt(p.stock || p.stockQuantity) || 0,
            stockQuantity: parseInt(p.stock || p.stockQuantity) || 0,
            category: p.category || null,
            status: p.status || 'active',
            images: imgArr,
            featuredImage: featImg,
            tags: Array.isArray(p.tags) ? p.tags : [],
            isFeatured: false,
            isNewArrival: true,
            isBestSeller: false,
            isActive: true,
            approval_status: 'pending',
          };
        })
      );

      const validItems = insertItems.filter(p => p.name && p.price > 0);
      if (validItems.length === 0) {
        return NextResponse.json({ error: 'No valid products provided with name and price' }, { status: 400 });
      }

      const { data: inserted, error: batchErr } = await supabase
        .from('products')
        .insert(validItems)
        .select('id, name, slug');

      if (batchErr) throw batchErr;

      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${inserted.length} products!`,
        count: inserted.length,
        products: inserted
      });
    }

    const rawPrice = body.sellingPrice !== undefined && body.sellingPrice !== null && body.sellingPrice !== ''
      ? body.sellingPrice
      : body.price;

    const rawRegularPrice = body.regularPrice !== undefined && body.regularPrice !== null && body.regularPrice !== ''
      ? body.regularPrice
      : (body.original_price !== undefined ? body.original_price : rawPrice);

    const rawStock = body.stockQuantity !== undefined && body.stockQuantity !== null && body.stockQuantity !== ''
      ? body.stockQuantity
      : body.stock;

    const {
      name,
      nameBn,
      description,
      descriptionBn,
      shortDescription,
      sku,
      category,
      status,
      isActive,
      images,
      brand,
      tags,
      featuredImage,
      isFeatured,
      isNewArrival,
      isBestSeller,
      attributes,
      variants,
    } = body;

    if (!name?.trim() || rawPrice === undefined || rawPrice === null || rawPrice === '') {
      return NextResponse.json({ error: 'Product name and selling price are required' }, { status: 400 });
    }

    // ✅ SECURITY: Validate price — must be a positive, finite number within reasonable range
    const parsedPrice = parseFloat(rawPrice);
    if (isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
    }
    if (parsedPrice > 10_000_000) {
      return NextResponse.json({ error: 'Price exceeds maximum allowed value' }, { status: 400 });
    }

    // ✅ SECURITY: Validate stock — must be a non-negative integer
    const parsedStock = parseInt(rawStock);
    if (rawStock !== undefined && rawStock !== null && rawStock !== '' && (isNaN(parsedStock) || parsedStock < 0)) {
      return NextResponse.json({ error: 'Stock must be a non-negative integer' }, { status: 400 });
    }

    const supabase = getVendorSupabaseClient();

    // Auto-upload base64 images to Cloudinary CDN
    let finalFeaturedImage = featuredImage || images?.[0] || '';
    if (finalFeaturedImage && typeof finalFeaturedImage === 'string' && finalFeaturedImage.startsWith('data:')) {
      try {
        const uploadRes = await uploadToCloudinary(finalFeaturedImage, 'stellar-mart/products');
        finalFeaturedImage = uploadRes.secure_url || uploadRes.url;
      } catch (uploadErr) {
        console.error('Failed to upload base64 vendor featuredImage to Cloudinary:', uploadErr);
      }
    }

    let finalImages = Array.isArray(images) ? images : [];
    if (finalImages.some(img => typeof img === 'string' && img.startsWith('data:'))) {
      finalImages = await Promise.all(
        finalImages.map(async (img) => {
          if (typeof img === 'string' && img.startsWith('data:')) {
            try {
              const res = await uploadToCloudinary(img, 'stellar-mart/products');
              return res.secure_url || res.url;
            } catch (err) {
              console.error('Failed to upload base64 vendor gallery image:', err);
              return img;
            }
          }
          return img;
        })
      );
    }

    const parsedRegularPrice = parseFloat(rawRegularPrice) || parsedPrice;
    const finalStockQty = isNaN(parsedStock) ? 0 : parsedStock;
    const productIsActive = isActive !== undefined ? Boolean(isActive) : (status ? status === 'active' : true);

    const productData = {
      vendor_id: session.userId || session.vendorId,
      name: name.trim(),
      nameBn: nameBn?.trim() || '',
      slug: generateSlug(name),
      description: description?.trim() || '',
      descriptionBn: descriptionBn?.trim() || '',
      shortDescription: shortDescription?.trim() || '',
      brand: brand?.trim() || '',
      price: parsedPrice,
      sellingPrice: parsedPrice,
      regularPrice: parsedRegularPrice,
      original_price: parsedRegularPrice,
      oldPrice: parsedRegularPrice,
      sku: sku?.trim() || null,
      stock: finalStockQty,
      stockQuantity: finalStockQty,
      category: category || null,
      status: productIsActive ? 'active' : 'inactive',
      images: finalImages,
      featuredImage: finalFeaturedImage,
      tags: Array.isArray(tags) ? tags : [],
      isFeatured: Boolean(isFeatured),
      isNewArrival: Boolean(isNewArrival),
      isBestSeller: Boolean(isBestSeller),
      isActive: productIsActive,
      attributes: Array.isArray(attributes) ? attributes : [],
      variants: Array.isArray(variants) ? variants : [],
      approval_status: 'pending',   // Admin must approve before it appears in live site
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select('id, name, slug, status, created_at')
      .single();

    if (error) throw error;

    console.log(`[VendorProduct] Created product ${product.id} for vendor ${session.vendorId}`);

    return NextResponse.json({
      success: true,
      message: 'Product published successfully!',
      product,
    });
  } catch (err) {
    console.error('Vendor create product error:', err);
    // ✅ SECURITY: Never leak internal error details (DB errors, stack traces) to client
    return NextResponse.json({ error: 'Failed to publish product. Please try again.' }, { status: 500 });
  }
}
