import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);



// GET: list vendor products pending admin review (or filtered by approval_status)
export async function GET(request) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const approvalStatus = searchParams.get('approval_status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('vendor_products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // '' means all statuses
    if (approvalStatus) {
      query = query.eq('approval_status', approvalStatus);
    }

    const { data: products, count, error } = await query.range(
      (page - 1) * limit,
      page * limit - 1
    );

    if (error) throw error;

    // Enrich with vendor info
    let enriched = products || [];
    if (enriched.length > 0) {
      const vendorIds = [...new Set(enriched.map((p) => p.vendor_id))];
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, shop_name, owner_name, email')
        .in('id', vendorIds);

      const vendorMap = {};
      (vendors || []).forEach((v) => { vendorMap[v.id] = v; });
      enriched = enriched.map((p) => ({ ...p, vendor: vendorMap[p.vendor_id] || null }));
    }

    return NextResponse.json({
      products: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('Admin vendor products list error:', err);
    return NextResponse.json({ error: 'Failed to fetch vendor products' }, { status: 500 });
  }
}