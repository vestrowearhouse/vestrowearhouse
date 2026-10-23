import { createClient } from '@supabase/supabase-js';

let _cachedClient = null;

const getSupabaseClient = () => {
  if (_cachedClient) return _cachedClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  _cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _cachedClient;
};

/**
 * Automatically splits a main order into vendor-specific orders
 * Call this inside your main Checkout API after saving to the main `orders` table.
 */
export async function splitOrderToVendors(mainOrderData, cartItems) {
  try {
    const supabase = getSupabaseClient();
    
    // 1. Group cart items by vendor_id
    const vendorItemsMap = {};
    
    cartItems.forEach(item => {
      // If the product has a vendor_id, group it. (Ignore admin/platform products with no vendor)
      if (item.vendor_id) {
        if (!vendorItemsMap[item.vendor_id]) {
          vendorItemsMap[item.vendor_id] = { items: [], total: 0 };
        }
        vendorItemsMap[item.vendor_id].items.push(item);
        vendorItemsMap[item.vendor_id].total += (item.price * item.quantity);
      }
    });

    // 2. Prepare data for vendor_orders table
    const vendorOrdersToInsert = Object.keys(vendorItemsMap).map(vendorId => {
      return {
        vendor_id: vendorId,
        order_id: mainOrderData.id,
        order_number: mainOrderData.order_number,
        customer_name: mainOrderData.shipping_address?.name || 'Customer',
        customer_phone: mainOrderData.shipping_address?.phone || '',
        customer_address: `${mainOrderData.shipping_address?.street || ''}, ${mainOrderData.shipping_address?.city || ''}`,
        items: vendorItemsMap[vendorId].items,
        total_amount: vendorItemsMap[vendorId].total,
        vendor_status: 'pending'
      };
    });

    // 3. Insert into vendor_orders table
    if (vendorOrdersToInsert.length > 0) {
      const { error } = await supabase.from('vendor_orders').insert(vendorOrdersToInsert);
      if (error) console.error('Failed to split vendor orders:', error);
    }
  } catch (error) {
    console.error('Vendor Order Split Error:', error);
  }
}