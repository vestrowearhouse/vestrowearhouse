import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

// In-memory fallback cache for vendor shipping configs (bounded)
const MAX_SHIPPING_CACHE = 100;
const shippingCache = new Map();

function setShippingCache(key, val) {
  if (shippingCache.size >= MAX_SHIPPING_CACHE) {
    const oldest = shippingCache.keys().next().value;
    if (oldest !== undefined) shippingCache.delete(oldest);
  }
  shippingCache.set(key, val);
}

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const supabase = getVendorSupabaseClient();
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, shop_name, description')
      .eq('id', session.vendorId)
      .maybeSingle();

    let savedConfig = shippingCache.get(session.vendorId) || null;

    if (!savedConfig && vendor?.description) {
      try {
        const parsed = JSON.parse(vendor.description);
        if (parsed && parsed.__shipping) {
          savedConfig = parsed.__shipping;
        }
      } catch {
        // description is plain text
      }
    }

    const defaultConfig = {
      inside_dhaka_rate: 60,
      outside_dhaka_rate: 120,
      express_shipping_rate: 150,
      free_shipping_threshold: 2000,
      processing_time: '1-2 Days',
      courier_partners: ['Steadfast Courier', 'Pathao Logistics'],
      allow_cash_on_delivery: true,
      allow_pickup: true
    };

    return NextResponse.json({
      success: true,
      shipping: savedConfig ? { ...defaultConfig, ...savedConfig } : defaultConfig
    });
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    return NextResponse.json({ error: 'Failed to fetch shipping settings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const body = await request.json();
    const supabase = getVendorSupabaseClient();

    // Cache the configuration
    setShippingCache(session.vendorId, body);

    // Save to vendor record safely
    const { data: vendor } = await supabase
      .from('vendors')
      .select('description')
      .eq('id', session.vendorId)
      .maybeSingle();

    let newDesc = '';
    try {
      const existing = vendor?.description ? JSON.parse(vendor.description) : {};
      existing.__shipping = body;
      newDesc = JSON.stringify(existing);
    } catch {
      newDesc = JSON.stringify({ bio: vendor?.description || '', __shipping: body });
    }

    await supabase
      .from('vendors')
      .update({ description: newDesc, updated_at: new Date().toISOString() })
      .eq('id', session.vendorId);

    return NextResponse.json({
      success: true,
      message: 'Shipping and delivery rates updated successfully!',
      shipping: body
    });
  } catch (error) {
    console.error('Error updating shipping settings:', error);
    return NextResponse.json({ error: 'Failed to save shipping settings' }, { status: 500 });
  }
}
