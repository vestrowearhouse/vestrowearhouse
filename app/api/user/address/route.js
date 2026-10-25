import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from '@/lib/secureJwt';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

// GET - Get user's current address
export async function GET(request) {
  try {
    const tokenData = await verifyUserToken(request);
    if (!tokenData || !tokenData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const userId = tokenData.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, phone, address')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      address: user.address || '',
      phone: user.phone || '',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error('[UserAddress] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 });
  }
}

// POST - Save or update address
export async function POST(request) {
  try {
    const tokenData = await verifyUserToken(request);
    if (!tokenData || !tokenData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { street, city, phone, address } = body;
    const userId = tokenData.id;

    // Combine street and city if provided separately
    let formattedAddress = '';
    if (street) {
      formattedAddress = street.trim();
      if (city && city.trim()) {
        formattedAddress += `, ${city.trim()}`;
      }
    } else if (address) {
      formattedAddress = typeof address === 'string' ? address.trim() : JSON.stringify(address);
    }

    const updateData = {
      address: formattedAddress,
      updated_at: new Date().toISOString()
    };

    if (phone && typeof phone === 'string' && phone.trim()) {
      updateData.phone = phone.trim();
    }

    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, name, email, phone, address')
      .single();

    if (error) {
      console.error('[UserAddress] Update error:', error);
      return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Address saved successfully',
      address: user.address,
      phone: user.phone,
      user
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error('[UserAddress] POST error:', error);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}
