
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
// ✅ Use centralized jose-based helper instead of raw jsonwebtoken
import { verifyUserToken } from '@/lib/secureJwt';

// Mark this route as dynamic since it reads request.cookies
export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return getSupabaseAdmin();
};

export async function POST(req) {
  try {
    // Support both authenticated users and guest checkout
    const tokenData = await verifyUserToken(req);
    const userId = tokenData?.id || null;

    const supabase = getSupabaseClient();
    const body = await req.json();
    const { items, shipping, payment, amounts, couponCode } = body;

    // Generate a unique Order Number (E.g. ORD-489123)
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    let discountAmount = 0;
    let verifiedTotal = (amounts?.subtotal || 0) + (amounts?.shipping || 0) + (amounts?.tax || 0);

    // Secure backend validation of coupon code
    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .single();

      if (couponError || !coupon) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
      }

      // Check coupon active status and schedule dates
      const now = new Date();
      if (coupon.status !== 'active') {
        return NextResponse.json({ error: 'Coupon is not active' }, { status: 400 });
      }
      if (coupon.start_date && new Date(coupon.start_date) > now) {
        return NextResponse.json({ error: 'Coupon activation date has not reached yet' }, { status: 400 });
      }
      if (coupon.end_date && new Date(coupon.end_date) < now) {
        return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
      }
      if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
        return NextResponse.json({ error: 'Coupon usage limit has been reached' }, { status: 400 });
      }
      if ((amounts?.subtotal || 0) < (coupon.min_order_amount || 0)) {
        return NextResponse.json({ error: `Minimum order amount not met (min: ৳${coupon.min_order_amount})` }, { status: 400 });
      }

      // Calculate discount amount
      if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round((amounts?.subtotal || 0) * (coupon.discount_value / 100));
      } else {
        discountAmount = Number(coupon.discount_value);
      }

      // Cap discount
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = Number(coupon.max_discount_amount);
      }
      if (discountAmount > (amounts?.subtotal || 0)) {
        discountAmount = amounts?.subtotal || 0;
      }

      verifiedTotal = verifiedTotal - discountAmount;

      // Update coupon usage count
      const { error: updateCouponError } = await supabase
        .from('coupons')
        .update({ used_count: (coupon.used_count || 0) + 1 })
        .eq('id', coupon.id);

      if (updateCouponError) {
        console.error('[Orders] Failed to update coupon usage count:', updateCouponError.message);
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        order_number: orderNumber,
        items: items,
        shipping_address: { ...shipping, transactionId: payment?.transactionId },
        payment_method: payment?.method || 'cod',
        payment_status: payment?.status || 'unpaid',
        subtotal: amounts?.subtotal || 0,
        shipping_cost: amounts?.shipping || 0,
        tax: amounts?.tax || 0,
        total: Math.round(verifiedTotal), // Use backend verified total
        status: 'pending',
        coupon_code: couponCode?.trim()?.toUpperCase() || null,
        discount: discountAmount
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('[Orders] Order created for user:', userId);

    // Update real sold_count for purchased products
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const prodId = it.productId || it.product || it.id || it._id;
        const qty = Math.max(1, Number(it.quantity || it.qty || 1));
        try {
          if (prodId) {
            const { data: p } = await supabase
              .from('products')
              .select('id, sold_count, stockQuantity, stock')
              .eq('id', prodId)
              .maybeSingle();

            if (p) {
              const newSold = (Number(p.sold_count) || 0) + qty;
              const updatePayload = { sold_count: newSold };
              if (p.stockQuantity !== null && p.stockQuantity !== undefined) {
                updatePayload.stockQuantity = Math.max(0, Number(p.stockQuantity) - qty);
              }
              if (p.stock !== null && p.stock !== undefined) {
                updatePayload.stock = Math.max(0, Number(p.stock) - qty);
              }
              await supabase.from('products').update(updatePayload).eq('id', p.id);
              continue;
            }
          }
          if (it.name) {
            const { data: pByName } = await supabase
              .from('products')
              .select('id, sold_count, stockQuantity, stock')
              .ilike('name', it.name.trim())
              .limit(1)
              .maybeSingle();

            if (pByName) {
              const newSold = (Number(pByName.sold_count) || 0) + qty;
              const updatePayload = { sold_count: newSold };
              if (pByName.stockQuantity !== null && pByName.stockQuantity !== undefined) {
                updatePayload.stockQuantity = Math.max(0, Number(pByName.stockQuantity) - qty);
              }
              if (pByName.stock !== null && pByName.stock !== undefined) {
                updatePayload.stock = Math.max(0, Number(pByName.stock) - qty);
              }
              await supabase.from('products').update(updatePayload).eq('id', pByName.id);
            }
          }
        } catch (soldErr) {
          console.error('[Orders] Failed to increment sold_count for item:', it.name, soldErr);
        }
      }
    }

    // Map id to _id so frontend compatibility remains intact
    const newOrder = { ...data, _id: data.id, orderNumber: data.order_number };

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('[Orders] Order placement error:', error);
    // Do NOT expose internal error details to the client
    return NextResponse.json({ error: 'অর্ডার দেওয়া সম্ভব হয়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    // Verify user is authenticated
    const tokenData = await verifyUserToken(req);
    if (!tokenData || !tokenData.id) {
      console.error('[Orders] Unauthorized GET attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const userId = tokenData.id;

    // Only fetch orders for the authenticated user
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('[Orders] Fetched', data.length, 'orders for user:', userId);

    // Map Supabase snake_case columns back to camelCase for the frontend
    const orders = data.map(order => ({
      ...order,
      _id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      amounts: { total: order.total }
    }));

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('[Orders] Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}