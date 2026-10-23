import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }

  return createClient(supabaseUrl, supabaseKey);
};

export async function PUT(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { id } = params;
    const body = await request.json();
    const supabase = getSupabaseClient();
    
    // 1. Prepare vendor updates
    const updates = {
      updated_at: new Date().toISOString()
    };
    if (body.shop_name !== undefined) updates.shop_name = body.shop_name.trim();
    if (body.owner_name !== undefined) updates.owner_name = body.owner_name.trim();
    if (body.email !== undefined) updates.email = body.email.toLowerCase().trim();
    if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).replace(/\D/g, '') : null;
    if (body.shop_address !== undefined) updates.shop_address = body.shop_address ? body.shop_address.trim() : null;
    if (body.description !== undefined) updates.description = body.description ? body.description.trim() : null;
    if (body.status !== undefined) updates.status = body.status;
    if (body.verification_badge !== undefined) updates.verification_badge = Boolean(body.verification_badge);
    if (body.is_verified !== undefined) updates.is_verified = Boolean(body.is_verified);
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

    // Optional password reset
    let hashedPassword = null;
    if (body.password && body.password.trim().length >= 4) {
      hashedPassword = await bcrypt.hash(body.password.trim(), 10);
      updates.password = hashedPassword;
    }

    const { data: updatedVendor, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 2. Synchronize associated user account if user_id exists
    const userId = updatedVendor.user_id;
    if (userId) {
      const userUpdates = {
        updated_at: new Date().toISOString()
      };
      if (body.owner_name) userUpdates.name = body.owner_name.trim();
      if (body.email) userUpdates.email = body.email.toLowerCase().trim();
      if (body.phone) userUpdates.phone = String(body.phone);
      if (body.status) userUpdates.status = body.status;
      if (hashedPassword) userUpdates.password = hashedPassword;

      await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId)
        .catch(e => console.warn('Failed to sync vendor user account:', e.message));
    }

    return NextResponse.json({ success: true, vendor: updatedVendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vendor' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { id } = params;
    const supabase = getSupabaseClient();

    // 1. Fetch vendor to locate linked user_id and shop_name
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('id, user_id, shop_name')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // 2. Remove vendor relationships (vendor_products, vendor_orders)
    try {
      await supabase.from('vendor_products').delete().eq('vendor_id', id);
    } catch (e) {
      console.warn('Vendor products cleanup notice:', e.message);
    }

    try {
      await supabase.from('vendor_orders').delete().eq('vendor_id', id);
    } catch (e) {
      console.warn('Vendor orders cleanup notice:', e.message);
    }

    // 3. Delete vendor row from vendors table
    const { error: vendorDeleteError } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);

    if (vendorDeleteError) throw vendorDeleteError;

    // 4. Delete linked user account if exists
    if (vendor.user_id) {
      try {
        await supabase
          .from('users')
          .delete()
          .eq('id', vendor.user_id);
      } catch (e) {
        console.warn('Linked user delete notice:', e.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Vendor "${vendor.shop_name}" and associated records deleted permanently.`
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete vendor' }, { status: 500 });
  }
}
