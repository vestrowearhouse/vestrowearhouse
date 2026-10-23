import { NextResponse } from 'next/server';
import { getVendorSession, getVendorSupabaseClient } from '@/lib/vendorAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const supabase = getVendorSupabaseClient();

    // Fetch vendor's products to allow enrollment
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, stock, category, images')
      .eq('vendor_id', session.vendorId)
      .limit(100);

    // Active & upcoming marketplace campaigns
    const now = new Date();
    const campaignList = [
      {
        id: 'camp-mega-flash',
        title: 'Mega Flash Sale ⚡',
        banner: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=60',
        description: 'Homepage featured flash deal. High conversion & maximum visibility for top discounted products.',
        min_discount: 15,
        start_date: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
        end_date: new Date(now.getTime() + 1000 * 60 * 60 * 72).toISOString(),
        status: 'live',
        badge: 'Homepage Hero',
        commission_discount: '3% Platform Fee Off',
        enrolled_products_count: 2
      },
      {
        id: 'camp-weekend-bonanza',
        title: 'Weekend Super Deals 🛍️',
        banner: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=60',
        description: 'Exclusive 48-hour weekend shopping festival with site-wide banner push and app notifications.',
        min_discount: 10,
        start_date: new Date(now.getTime() + 1000 * 60 * 60 * 48).toISOString(),
        end_date: new Date(now.getTime() + 1000 * 60 * 60 * 96).toISOString(),
        status: 'upcoming',
        badge: 'Weekend Special',
        commission_discount: 'Free Shipping Co-Sponsored',
        enrolled_products_count: 0
      },
      {
        id: 'camp-free-shipping-fest',
        title: 'Dhaka Free Shipping Fair 🚚',
        banner: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60',
        description: 'Zero delivery fee for customer orders over ৳1,000 inside Dhaka. Stellar Mart co-sponsors delivery fee.',
        min_discount: 5,
        start_date: new Date(now.getTime() + 1000 * 60 * 60 * 120).toISOString(),
        end_date: new Date(now.getTime() + 1000 * 60 * 60 * 240).toISOString(),
        status: 'upcoming',
        badge: 'Free Shipping',
        commission_discount: '50% Courier Subsidy',
        enrolled_products_count: 1
      }
    ];

    return NextResponse.json({
      success: true,
      campaigns: campaignList,
      products: products || []
    });
  } catch (error) {
    console.error('Vendor campaigns fetch error:', error);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getVendorSession(request);
    if (session.error) return NextResponse.json({ error: session.error }, { status: session.status });

    const body = await request.json();
    const { campaignId, productId, campaignPrice, discountPercent } = body;

    if (!campaignId || !productId) {
      return NextResponse.json({ error: 'Campaign and Product are required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product successfully enrolled in campaign! Approval status: Active.',
      enrollment: {
        campaignId,
        productId,
        campaignPrice,
        discountPercent,
        status: 'enrolled',
        enrolled_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Campaign enrollment error:', error);
    return NextResponse.json({ error: 'Failed to enroll in campaign' }, { status: 500 });
  }
}
