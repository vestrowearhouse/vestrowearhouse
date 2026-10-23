import { NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/secureJwt';
import { getSupabaseAdmin } from '@/lib/supabase';

const getSupabaseClient = () => {
  return getSupabaseAdmin();
};


// GET - Get user's wishlist
export async function GET(request) {
  try {
    const decoded = verifyUserToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    
    const wishlistIds = user.wishlist || [];
    
    if (wishlistIds.length === 0) {
      return NextResponse.json({ wishlist: [] });
    }
    
    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, images, featuredImage, price, sellingPrice, stockQuantity, stock, stockStatus, category')
      .in('id', wishlistIds);
      
    if (productsError) throw productsError;
    
    // Transform wishlist items
    const wishlist = (products || []).map(item => ({
      _id: item.id,
      name: item.name,
      slug: item.slug,
      image: item.featuredImage || item.images?.[0] || '/placeholder.jpg',
      price: item.price || item.sellingPrice,
      salePrice: item.sellingPrice || item.price,
      inStock: (item.stockQuantity > 0 || item.stock > 0) || item.stockStatus !== 'out_of_stock',
      category: item.category
    }));
    
    return NextResponse.json({
      wishlist
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to get wishlist' },
      { status: 500 }
    );
  }
}

// POST - Add item to wishlist
export async function POST(request) {
  try {
    const decoded = verifyUserToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { productId } = await request.json();
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();
      
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
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
    
    let wishlist = user.wishlist || [];
    
    // Add to wishlist if not already present
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ wishlist })
        .eq('id', decoded.id);
        
      if (updateError) throw updateError;
    }
    
    return NextResponse.json({
      message: 'Product added to wishlist',
      wishlist
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
    const decoded = verifyUserToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { productId } = await request.json();
    
    if (!productId) {
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
    
    let wishlist = user.wishlist || [];
    
    // Remove from wishlist
    wishlist = wishlist.filter(id => id !== productId);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ wishlist })
      .eq('id', decoded.id);
      
    if (updateError) throw updateError;
    
    return NextResponse.json({
      message: 'Product removed from wishlist',
      wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}