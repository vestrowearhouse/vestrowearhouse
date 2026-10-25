import { NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/secureJwt';
import { getSupabaseAdmin } from '@/lib/supabase';
import { normalizeId } from '@/lib/normalizeId';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return getSupabaseAdmin();
};

/**
 * Resolves the primary product image URL from featuredImage or images column.
 * Handles:
 *  1. Array of URLs (e.g. ['https://...'])
 *  2. JSON stringified array (e.g. '["https://..."]')
 *  3. Plain URL string (e.g. 'https://...' or '/...')
 * Returns '/placeholder.jpg' if none is valid.
 */
export function getProductImageUrl(featuredImage, images) {
  if (featuredImage && typeof featuredImage === 'string') {
    const trimmed = featuredImage.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
  }

  if (images) {
    // 1. Array
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      if (typeof first === 'string' && first.trim()) {
        const trimmedFirst = first.trim();
        if (trimmedFirst.startsWith('http://') || trimmedFirst.startsWith('https://') || trimmedFirst.startsWith('/')) {
          return trimmedFirst;
        }
      }
    }

    // 2. String (JSON representation or plain URL)
    if (typeof images === 'string') {
      const trimmed = images.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const first = parsed[0];
            if (typeof first === 'string' && first.trim()) {
              const trimmedFirst = first.trim();
              if (trimmedFirst.startsWith('http://') || trimmedFirst.startsWith('https://') || trimmedFirst.startsWith('/')) {
                return trimmedFirst;
              }
            }
          }
        } catch (e) {
          // ignore invalid JSON parse
        }
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        return trimmed;
      }
    }
  }

  return '/placeholder.jpg';
}

const formatWishlistProducts = async (supabase, productIds) => {
  const normalizedIds = (productIds || []).map(normalizeId).filter(Boolean);
  if (normalizedIds.length === 0) return [];

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, images, featuredImage, price, sellingPrice, selling_price, stockQuantity, stock, stockStatus, category')
    .in('id', normalizedIds);

  if (error || !products) return [];

  return products.map(item => ({
    _id: normalizeId(item.id),
    id: normalizeId(item.id),
    name: item.name,
    slug: item.slug,
    image: getProductImageUrl(item.featuredImage, item.images),
    price: item.price || item.sellingPrice || item.selling_price || 0,
    salePrice: item.sellingPrice || item.selling_price || item.price || 0,
    inStock: (item.stockQuantity > 0 || item.stock > 0) || item.stockStatus !== 'out_of_stock',
    category: item.category
  }));
};

// GET - Get user's wishlist
export async function GET(request) {
  try {
    const decoded = await verifyUserToken(request);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Unauthorized', wishlist: [] },
        { status: 401 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Get user with wishlist
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', decoded.id)
      .single();
      
    if (userError || !user) {
      return NextResponse.json({ wishlist: [] });
    }
    
    const wishlistIds = (user.wishlist || []).map(normalizeId).filter(Boolean);
    const wishlist = await formatWishlistProducts(supabase, wishlistIds);
    
    return NextResponse.json({ wishlist }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to get wishlist', wishlist: [] },
      { status: 500 }
    );
  }
}

// POST - Add item to wishlist (supports single { productId } or batch { productIds: [...] })
export async function POST(request) {
  try {
    const decoded = await verifyUserToken(request);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Support both single productId and batch productIds array
    let targetIds = [];
    if (Array.isArray(body?.productIds)) {
      targetIds = body.productIds.map(normalizeId).filter(Boolean);
    } else if (body?.productId) {
      const single = normalizeId(body.productId);
      if (single) targetIds.push(single);
    }
    
    if (targetIds.length === 0) {
      return NextResponse.json(
        { error: 'Product ID or productIds array is required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Validate products exist
    if (targetIds.length === 1) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', targetIds[0])
        .single();
        
      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
    } else {
      const { data: validProducts } = await supabase
        .from('products')
        .select('id')
        .in('id', targetIds);
        
      if (validProducts && validProducts.length > 0) {
        targetIds = validProducts.map(p => normalizeId(p.id)).filter(Boolean);
      }
    }
    
    // Get current wishlist
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', decoded.id)
      .single();
      
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let wishlistIds = (user.wishlist || []).map(normalizeId).filter(Boolean);
    const combined = Array.from(new Set([...wishlistIds, ...targetIds]));
    
    if (combined.length !== wishlistIds.length) {
      wishlistIds = combined;
      const { error: updateError } = await supabase
        .from('users')
        .update({ wishlist: wishlistIds })
        .eq('id', decoded.id);
        
      if (updateError) throw updateError;
    }
    
    const fullWishlist = await formatWishlistProducts(supabase, wishlistIds);

    return NextResponse.json({
      message: targetIds.length > 1 ? 'Products added to wishlist' : 'Product added to wishlist',
      wishlist: fullWishlist
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from wishlist
export async function DELETE(request) {
  try {
    const decoded = await verifyUserToken(request);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const targetProductId = normalizeId(body?.productId);
    
    if (!targetProductId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Get current wishlist
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', decoded.id)
      .single();
      
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let wishlistIds = (user.wishlist || []).map(normalizeId).filter(Boolean);
    wishlistIds = wishlistIds.filter(id => id !== targetProductId);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ wishlist: wishlistIds })
      .eq('id', decoded.id);
      
    if (updateError) throw updateError;
    
    const fullWishlist = await formatWishlistProducts(supabase, wishlistIds);

    return NextResponse.json({
      message: 'Product removed from wishlist',
      wishlist: fullWishlist
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}