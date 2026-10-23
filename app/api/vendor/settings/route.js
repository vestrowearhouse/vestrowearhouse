import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const supabase = getVendorSupabaseClient();
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', session.vendorId)
      .single();

    if (error || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ ...vendor, vendor });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  return updateSettings(request);
}

export async function PATCH(request) {
  return updateSettings(request);
}

async function updateSettings(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const supabase = getVendorSupabaseClient();
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', session.vendorId)
      .single();

    if (!existingVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const desiredUpdate = {
      shop_name: body.shop_name,
      owner_name: body.owner_name,
      shop_email: body.shop_email || body.email,
      owner_phone: body.owner_phone || body.phone,
      email: body.email || body.shop_email,
      phone: body.phone || body.owner_phone,
      shop_address: body.shop_address,
      description: body.description,
      logo_url: body.logo_url,
      banner_url: body.banner_url,
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    const update = {};
    Object.entries(desiredUpdate).forEach(([key, value]) => {
      if (value !== undefined && Object.prototype.hasOwnProperty.call(existingVendor, key)) {
        update[key] = value;
      }
    });

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(update)
      .eq('id', session.vendorId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update vendor settings' }, { status: 400 });
    }

    return NextResponse.json({ ...vendor, vendor });
  } catch (error) {
    console.error('Error updating vendor settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
