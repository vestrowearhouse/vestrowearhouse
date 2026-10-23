import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      '[vendorAuth] JWT_SECRET env variable is missing or too short (min 32 chars). ' +
      'Set it in .env.local and in your Vercel environment variables.'
    );
  }
  return new TextEncoder().encode(secret);
}

let _cachedVendorClient = null;

export function getVendorSupabaseClient() {
  if (_cachedVendorClient) return _cachedVendorClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }

  _cachedVendorClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _cachedVendorClient;
}

export async function getVendorSession(request) {
  const token = request.cookies.get('vendorToken')?.value;
  if (!token) {
    return { error: 'Not authenticated', status: 401 };
  }

  try {
    const { payload: decoded } = await jwtVerify(token, getJwtSecret());
    if (decoded.role !== 'vendor' || !decoded.vendor_id) {
      return { error: 'Not a vendor session', status: 403 };
    }

    return {
      userId: decoded.id,
      vendorId: decoded.vendor_id,
      email: decoded.email,
      shopName: decoded.shop_name,
      role: decoded.role,
    };
  } catch {
    return { error: 'Invalid session', status: 401 };
  }
}