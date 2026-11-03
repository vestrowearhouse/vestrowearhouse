import { createClient } from '@supabase/supabase-js';

let _adminClient = null;

/**
 * Returns an authenticated Supabase client using the Service Role Key.
 * Throws a clean error if the key is missing (never silently falls back to anon key).
 */
export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required');
  }
  if (!_adminClient) {
    _adminClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _adminClient;
}

/**
 * Lazy proxy that delegates property access to getAdminSupabase().
 * Ensures module-level instances do not fail during build evaluation,
 * and fail fast with a 500 error at request time if the key is missing.
 */
export const adminSupabase = new Proxy({}, {
  get(target, prop) {
    const client = getAdminSupabase();
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});

/**
 * Reads excluded internal/test visitor IDs from EXCLUDED_VISITOR_IDS env var.
 * @returns {string[]} List of excluded visitor IDs
 */
export function getExcludedVisitorIds() {
  const raw = process.env.EXCLUDED_VISITOR_IDS || '';
  return raw
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
}

// In-memory cache for valid public tables (60-second TTL)
let cachedTables = null;
let cacheExpiry = 0;

/**
 * Retrieves valid table names in the public schema.
 * Queries get_public_tables RPC first, falling back to discovered candidate tables.
 * Results are cached for 60 seconds so every sidebar table is clickable and valid.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<Set<string>>} Set of lowercase table names
 */
export async function getValidPublicTables(supabase) {
  const now = Date.now();
  if (cachedTables && now < cacheExpiry) {
    return cachedTables;
  }

  try {
    const { data, error } = await supabase.rpc('get_public_tables');
    if (!error && Array.isArray(data) && data.length > 0) {
      const names = data
        .map(t => (t.name || t.table_name || '').toLowerCase().trim())
        .filter(Boolean);
      cachedTables = new Set(names);
      cacheExpiry = now + 60 * 1000;
      return cachedTables;
    }
  } catch {
    // RPC not available or failed, fall back to discovery
  }

  // Safe fallback list of known public tables
  const fallbackCandidates = [
    'products', 'orders', 'categories', 'users', 'coupons', 'banners',
    'reviews', 'marketing_campaigns', 'page_views', 'page_logs',
    'activity_logs', 'build_logs', 'admins', 'notifications',
    'quick_channels', 'product_variants', 'subcategories', 'brands',
    'order_items', 'carts', 'wishlists', 'pages', 'settings',
    'contact_messages', 'newsletters', 'vendor_payouts', 'chat_sessions',
    'chat_messages', 'vendors', 'vendor_products', 'vendor_orders',
    'vendor_revenue', 'support_messages'
  ];

  cachedTables = new Set(fallbackCandidates);
  cacheExpiry = now + 60 * 1000;
  return cachedTables;
}
