import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

const editableFields = [
  'shop_name',
  'owner_name',
  'email',
  'phone',
  'shop_email',
  'owner_phone',
  'shop_address',
  'description',
  'logo_url',
  'banner_url',
];

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

    const { count: deliveredOrders } = await supabase
      .from('vendor_orders')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', session.vendorId)
      .eq('vendor_status', 'delivered');

    const { data: revenue } = await supabase
      .from('vendor_revenue')
      .select('final_amount')
      .eq('vendor_id', session.vendorId)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({
      ...vendor,
      vendor,
      stats: {
        delivered_orders: deliveredOrders || 0,
        last_revenue: revenue?.[0]?.final_amount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  return updateProfile(request);
}

export async function PATCH(request) {
  return updateProfile(request);
}

async function updateProfile(request) {
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
    const update = {};
    editableFields.forEach((field) => {
      if (body[field] !== undefined && Object.prototype.hasOwnProperty.call(existingVendor, field)) {
        update[field] = body[field];
      }
    });

    if (body.email !== undefined && Object.prototype.hasOwnProperty.call(existingVendor, 'shop_email')) {
      update.shop_email = body.email;
    }

    if (body.phone !== undefined && Object.prototype.hasOwnProperty.call(existingVendor, 'owner_phone')) {
      update.owner_phone = body.phone;
    }

    if (Object.prototype.hasOwnProperty.call(existingVendor, 'updated_at')) {
      update.updated_at = new Date().toISOString();
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(update)
      .eq('id', session.vendorId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update vendor profile' }, { status: 400 });
    }

    return NextResponse.json({ ...vendor, vendor });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
