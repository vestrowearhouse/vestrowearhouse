import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from '@/lib/secureJwt';

// Mark this route as dynamic since it reads request.cookies
export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

// GET - Get current user's profile
export async function GET(request) {
  try {
    const tokenData = await verifyUserToken(request);
    if (!tokenData || !tokenData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const userId = tokenData.id;

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, avatar, status, created_at, last_login')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[UserProfile] User fetch error:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[UserProfile] Orders fetch error:', ordersError);
    }

    const formattedOrders = (ordersData || []).map(order => ({
      ...order,
      _id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      amounts: { total: order.total }
    }));

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        _id: user.id,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('[UserProfile] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const tokenData = await verifyUserToken(request);
    if (!tokenData || !tokenData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatar } = body;
    const userId = tokenData.id;

    const supabase = getSupabaseClient();

    // Update user
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[UserProfile] Update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        _id: user.id,
      },
    });
  } catch (error) {
    console.error('[UserProfile] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}