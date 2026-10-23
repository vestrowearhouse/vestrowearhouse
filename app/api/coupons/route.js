import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim().toUpperCase();
    const active = searchParams.get('active');

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const cacheKey = `coupon:${code}:${active || 'all'}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('coupons')
      .select('id, code, discount_type, discount_value, min_order_amount, max_discount_amount, status, start_date, end_date, usage_limit')
      .eq('code', code);

    if (active === 'true') {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching coupon:', error);
      return NextResponse.json(
        { error: 'Failed to fetch coupon' },
        { status: 500 }
      );
    }

    let validCoupons = data || [];
    
    if (active === 'true' && validCoupons.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      validCoupons = validCoupons.filter(c => {
        if (c.start_date) {
          const start = new Date(c.start_date);
          start.setHours(0, 0, 0, 0);
          if (now < start) return false;
        }
        if (c.end_date) {
          const end = new Date(c.end_date);
          end.setHours(0, 0, 0, 0);
          if (now > end) return false;
        }
        // Check usage limits
        if (c.usage_limit !== null && c.usage_count >= c.usage_limit) {
          return false;
        }
        return true;
      });
    }

    const responseData = { coupons: validCoupons };
    setCache(cacheKey, responseData, 60);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Coupon fetch error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
