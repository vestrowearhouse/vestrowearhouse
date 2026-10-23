import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Standard Starter Page Templates for Bangladeshi E-Commerce
const DEFAULT_TEMPLATES = [
  {
    title_en: 'Frequently Asked Questions (FAQ)',
    title_bn: 'সাধারণ জিজ্ঞাসাসমূহ (FAQ)',
    slug: 'faq',
    meta_title: 'Frequently Asked Questions | StellarMartBD',
    meta_description: 'Find answers to common questions about orders, shipping, payment methods, delivery across Bangladesh, and returns at StellarMartBD.',
    is_active: true,
    content_en: `<h2>1. How do I place an order?</h2>
<p>Browse our catalog, select your desired items, choose quantity or variations, and click <strong>Add to Cart</strong>. Proceed to checkout, enter your shipping address, and select your payment method (bKash, Nagad, Card, or Cash on Delivery).</p>

<h2>2. How long does delivery take?</h2>
<p>We deliver nationwide across all 64 districts of Bangladesh:</p>
<ul>
  <li><strong>Inside Dhaka Metro:</strong> 24 to 48 hours</li>
  <li><strong>Sub-Dhaka & Major Divisions:</strong> 2 to 3 business days</li>
  <li><strong>Rest of Bangladesh:</strong> 3 to 5 business days</li>
</ul>

<h2>3. What payment methods are accepted?</h2>
<p>We accept Cash on Delivery (COD), bKash, Nagad, Rocket, Upay, Visa, MasterCard, and direct Internet Banking.</p>

<h2>4. How can I track my shipment?</h2>
<p>Once dispatched, you will receive an SMS and email notification containing your courier tracking number. You can also view real-time tracking in your <strong>Orders</strong> dashboard.</p>

<h2>5. What if I receive a defective or wrong product?</h2>
<p>Notify our customer support within 24 hours of delivery. We will arrange a free pickup and replacement or instant refund according to our Return Policy.</p>`
  },
  {
    title_en: 'Shipping & Delivery Policy',
    title_bn: 'শিপিং ও ডেলিভারি নীতিমালা',
    slug: 'shipping-policy',
    meta_title: 'Shipping & Delivery Information | StellarMartBD',
    meta_description: 'Fast, secure doorstep delivery across all 64 districts of Bangladesh. Learn about delivery fees, timeframes, and tracking.',
    is_active: true,
    content_en: `<h2>Nationwide Delivery Network</h2>
<p>StellarMartBD partners with Bangladesh's premier logistics providers (Steadfast, Pathao, RedX, eCourier, and SA Paribahan) to ensure guaranteed doorstep delivery to every upazila.</p>

<h2>Shipping Rates</h2>
<ul>
  <li><strong>Inside Dhaka City:</strong> ৳60 (Free on orders above ৳1,500)</li>
  <li><strong>Dhaka Suburbs (Gazipur, Savar, Narayanganj):</strong> ৳100</li>
  <li><strong>Outside Dhaka (All 64 Districts):</strong> ৳120</li>
</ul>

<h2>Delivery Timeframes</h2>
<p>Orders confirmed before 2:00 PM are handed over to couriers the same day. Average transit time is 1-2 days for Dhaka and 2-4 days for district headquarters.</p>

<h2>Inspection upon Delivery</h2>
<p>Customers are strictly advised to inspect the outer parcel seal in front of the delivery rider before accepting. In case of tamper or visible transit damage, please refuse acceptance and call our helpline immediately.</p>`
  },
  {
    title_en: 'Return & Refund Policy',
    title_bn: 'রিটার্ন ও রিফান্ড নীতিমালা',
    slug: 'return-refund-policy',
    meta_title: 'Return & Refund Policy | 7-Day Easy Returns StellarMartBD',
    meta_description: 'Easy 7-day return policy for eligible products. Learn how to initiate a return, conditions, and refund processing times.',
    is_active: true,
    content_en: `<h2>7-Day Easy Return Window</h2>
<p>If you are not 100% satisfied with your purchase, you may initiate a return within <strong>7 days</strong> of delivery.</p>

<h2>Eligibility Conditions</h2>
<ul>
  <li>Product must remain unused, unworn, and unwashed.</li>
  <li>Original tags, warranty cards, manuals, and manufacturer packaging must be intact.</li>
  <li>Serial numbers or IMEI codes must match invoice records.</li>
  <li>Items marked as <em>Final Clearance</em> or hygiene-sensitive items are non-returnable unless defective on arrival.</li>
</ul>

<h2>Refund Processing Time</h2>
<p>Once returned items pass quality inspection at our fulfillment hub:</p>
<ul>
  <li><strong>bKash / Nagad:</strong> 24 to 48 business hours</li>
  <li><strong>Debit / Credit Card:</strong> 5 to 7 business days (subject to issuing bank)</li>
  <li><strong>Store Credit / Wallet:</strong> Instant</li>
</ul>`
  },
  {
    title_en: 'Warranty & Support Policy',
    title_bn: 'ওয়ারেন্টি ও সহায়তা নীতিমালা',
    slug: 'warranty-policy',
    meta_title: 'Warranty & Official Support Guide | StellarMartBD',
    meta_description: 'Learn about official brand warranty, StellarMartBD replacement guarantee, and authorized service centers.',
    is_active: true,
    content_en: `<h2>Warranty Coverage</h2>
<p>All electronic appliances, smartphones, computers, and branded accessories sold on StellarMartBD come with either an <strong>Official Brand Warranty</strong> or a <strong>StellarMartBD Replacement Warranty</strong> as specified on the product page.</p>

<h2>How to Claim Warranty</h2>
<ol>
  <li>Keep your order invoice and warranty registration slip handy.</li>
  <li>Visit any authorized brand service center listed on your warranty document.</li>
  <li>Alternatively, contact StellarMartBD Support at support@stellarmartbd.com, and we will facilitate manufacturer service on your behalf.</li>
</ol>

<h2>What is Not Covered?</h2>
<p>Physical damage, water spillage, electrical surge damage, unauthorized third-party repairs, or software tampering voids warranty claims.</p>`
  }
];

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 200;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');

    let query = supabase
      .from('pages')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`title_en.ilike.%${search}%,slug.ilike.%${search}%,meta_title.ilike.%${search}%`);
    }

    if (status === 'published') {
      query = query.eq('is_active', true);
    } else if (status === 'draft') {
      query = query.eq('is_active', false);
    }

    try {
      query = query.order('created_at', { ascending: false });
    } catch {
      // Fallback
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.warn('Pages fetch warning:', error);
      // Retry without order in case created_at doesn't exist
      const fallback = await supabase.from('pages').select('*', { count: 'exact' }).range(offset, offset + limit - 1);
      return NextResponse.json({
        pages: fallback.data || [],
        total: fallback.count || 0
      });
    }

    return NextResponse.json({
      pages: data || [],
      total: count || (data?.length || 0)
    });
  } catch (error) {
    console.error('Pages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Special Action: Seed standard e-commerce templates
    if (body.action === 'seed_defaults') {
      const inserted = [];
      for (const tpl of DEFAULT_TEMPLATES) {
        // Check if slug already exists
        const { data: existing } = await supabase
          .from('pages')
          .select('id')
          .eq('slug', tpl.slug)
          .maybeSingle();

        if (!existing) {
          const { data, error } = await supabase
            .from('pages')
            .insert([{
              ...tpl,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select();
          if (!error && data?.[0]) inserted.push(data[0]);
        }
      }
      return NextResponse.json({
        success: true,
        message: `Successfully seeded ${inserted.length} default store policy pages!`,
        seeded: inserted
      });
    }

    // Normal Page creation
    if (!body.title_en || !body.title_en.trim()) {
      return NextResponse.json({ error: 'Page title is required' }, { status: 400 });
    }

    const slug = (body.slug || body.title_en)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json({ error: `The URL slug "${slug}" is already used by another page.` }, { status: 400 });
    }

    const payload = {
      title_en: body.title_en.trim(),
      title_bn: body.title_bn?.trim() || null,
      slug: slug,
      content_en: body.content_en || '',
      content_bn: body.content_bn || null,
      meta_title: body.meta_title?.trim() || body.title_en.trim(),
      meta_description: body.meta_description?.trim() || null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pages')
      .insert([payload])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message || 'Failed to create page' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error) {
    console.error('Page creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }
    const updatePayload = { ...body };
    delete updatePayload.id;
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('pages')
      .update(updatePayload)
      .eq('id', body.id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, page: data?.[0] });
  } catch (error) {
    console.error('Page update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update page' }, { status: 500 });
  }
}