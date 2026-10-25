import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyUserToken } from '@/lib/secureJwt';

const getSupabaseClient = () => {
  return getSupabaseAdmin();
};

// Helper to resolve the database cart session key (always prefixed with user_ for accounts)
const resolveCartSessionKey = async (request, explicitUserId, explicitSessionId) => {
  if (explicitUserId) {
    return explicitUserId.startsWith('user_') ? explicitUserId : `user_${explicitUserId}`;
  }

  // Check auth cookie token
  try {
    const decoded = await verifyUserToken(request);
    if (decoded && decoded.id) {
      return `user_${decoded.id}`;
    }
  } catch (err) {
    // Ignore invalid token
  }

  if (explicitSessionId) {
    return explicitSessionId;
  }

  return null;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    const cartKey = await resolveCartSessionKey(request, userId, sessionId);

    if (!cartKey) {
      return NextResponse.json({ cart: { items: [] } });
    }

    const supabase = getSupabaseClient();
    const { data: cart, error } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', cartKey)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is Supabase's "Not Found" code
      console.error('Supabase GET error:', error);
    }
    
    return NextResponse.json({ cart: cart || { items: [] } });
  } catch (error) {
    console.error('Cart GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { product, quantity = 1, sessionId, userId, variantData } = data;

    const cartKey = await resolveCartSessionKey(request, userId, sessionId);

    if (!product || !cartKey) {
      return NextResponse.json({ error: `Missing fields: Product is ${!!product}, CartKey is ${!!cartKey}` }, { status: 400 });
    }

    const productId = product._id || product.id || (typeof product === 'string' ? product : null);

    if (!productId) {
      return NextResponse.json({ error: 'Invalid product format. Product ID is missing.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    let { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', cartKey)
      .single();

    let items = cart?.items || [];
    const variantSku = variantData?.variantSku || null;

    const existingIndex = items.findIndex((item) => {
      const itemId = item.product?._id || item.product?.id || item.productId || item.id;
      if (String(itemId) !== String(productId)) return false;
      if (variantSku || item.variantSku || item.variantData?.variantSku) {
        return (item.variantSku || item.variantData?.variantSku) === variantSku;
      }
      return true;
    });

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
      if (variantData) {
        items[existingIndex].variantData = variantData;
        items[existingIndex].variantPrice = variantData.variantPrice || items[existingIndex].variantPrice;
        items[existingIndex].variantSku = variantSku;
      }
    } else {
      items.push({
        product,
        quantity,
        variantData: variantData || null,
        variantPrice: variantData?.variantPrice || product.sellingPrice || product.price || 0,
        variantSku: variantSku || null,
      });
    }

    const { data: updatedCart, error } = await supabase
      .from('carts')
      .upsert({ session_id: cartKey, items }, { onConflict: 'session_id' })
      .select()
      .single();
      
    if (error) throw error;

    return NextResponse.json({ cart: updatedCart, message: 'Product added to cart' });
  } catch (error) {
    console.error('Cart POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { productId, quantity, sessionId, userId, variantSku } = data;

    const cartKey = await resolveCartSessionKey(request, userId, sessionId);

    if (!cartKey) {
      return NextResponse.json({ error: 'Cart session not specified' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', cartKey)
      .single();

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    let items = cart.items || [];
    const itemIndex = items.findIndex((item) => {
      const itemId = item.product?._id || item.product?.id || item.productId || item.id;
      if (String(itemId) !== String(productId)) return false;
      if (variantSku || item.variantSku || item.variantData?.variantSku) {
        return (item.variantSku || item.variantData?.variantSku) === variantSku;
      }
      return true;
    });

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        items = items.filter((_, index) => index !== itemIndex);
      } else {
        items[itemIndex].quantity = quantity;
      }
    }

    const { data: updatedCart, error } = await supabase
      .from('carts')
      .upsert({ session_id: cartKey, items }, { onConflict: 'session_id' })
      .select()
      .single();
      
    if (error) throw error;

    return NextResponse.json({ cart: updatedCart });
  } catch (error) {
    console.error('Cart PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const variantSku = searchParams.get('variantSku');
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const isClear = searchParams.get('clear') === 'true';

    const cartKey = await resolveCartSessionKey(request, userId, sessionId);

    if (!cartKey) {
      return NextResponse.json({ message: 'Cart session not specified' });
    }

    const supabase = getSupabaseClient();
    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', cartKey)
      .single();

    if (!cart) {
      return NextResponse.json({ message: 'Cart is empty', cart: { items: [] } });
    }

    let items = cart.items || [];

    if (isClear) {
      items = [];
    } else if (productId) {
      items = items.filter((item) => {
        const itemId = item.product?._id || item.product?.id || item.productId || item.id;
        if (String(itemId) !== String(productId)) return true;
        if (variantSku || item.variantSku || item.variantData?.variantSku) {
          return (item.variantSku || item.variantData?.variantSku) !== variantSku;
        }
        return false;
      });
    } else {
      items = [];
    }

    const { data: updatedCart, error } = await supabase
      .from('carts')
      .upsert({ session_id: cartKey, items }, { onConflict: 'session_id' })
      .select()
      .single();
      
    if (error) throw error;

    return NextResponse.json({ cart: updatedCart, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Cart DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
