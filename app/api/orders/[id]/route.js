import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from '@/lib/secureJwt';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(req, { params }) {
  try {
    const tokenData = await verifyUserToken(req);
    if (!tokenData || !tokenData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const supabase = getSupabaseClient();
    const userId = tokenData.id;

    // We can query by id or order_number
    let query = supabase.from('orders').select('*').eq('user_id', userId);
    
    // Check if id is UUID or OrderNumber
    if (id.startsWith('ORD-')) {
      query = query.eq('order_number', id);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = {
      ...data,
      _id: data.id,
      orderNumber: data.order_number,
      createdAt: data.created_at,
      amounts: { 
        subtotal: data.subtotal,
        shipping: data.shipping_cost,
        tax: data.tax,
        total: data.total 
      }
    };

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('[Orders] Fetch order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
