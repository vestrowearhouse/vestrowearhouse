import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('[vendorLogin] JWT_SECRET is not configured or too short. Set it in .env.local and Vercel.');
  }
  return secret;
}

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }

  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const rawIdentifier = String(email).trim();
    const normalizedEmail = rawIdentifier.toLowerCase();

    // 1. Check in users table by email
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // 2. Check in vendors table by email or username or shop_name
    let { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .or(`email.eq.${normalizedEmail},username.eq.${rawIdentifier},shop_name.eq.${rawIdentifier}`)
      .maybeSingle();

    // If user exists, but vendor not found, search by user_id
    if (user && !vendor) {
      const { data: v } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      vendor = v;
    }

    // If vendor exists, but user not found, search by vendor.user_id or vendor.email
    if (vendor && !user) {
      if (vendor.user_id) {
        const { data: u } = await supabase
          .from('users')
          .select('*')
          .eq('id', vendor.user_id)
          .maybeSingle();
        user = u;
      }
      if (!user && vendor.email) {
        const { data: u } = await supabase
          .from('users')
          .select('*')
          .eq('email', vendor.email.toLowerCase().trim())
          .maybeSingle();
        user = u;
      }
    }

    // If neither exists
    if (!user && !vendor) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Password verification (checks against bcrypt hash or plaintext with automatic upgrade)
    const candidatePasswords = [user?.password, vendor?.password].filter(Boolean);
    let isValid = false;
    let matchedPlaintext = false;

    for (const storedPass of candidatePasswords) {
      const isBcrypt = storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$') || storedPass.startsWith('$2y$');
      if (isBcrypt) {
        if (await bcrypt.compare(password, storedPass)) {
          isValid = true;
          break;
        }
      } else {
        if (storedPass === password) {
          isValid = true;
          matchedPlaintext = true;
          break;
        }
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // If legacy plaintext matched, upgrade hash to bcrypt immediately
    if (matchedPlaintext) {
      const upgradedHash = await bcrypt.hash(password, 10);
      if (user) {
        await supabase.from('users').update({ password: upgradedHash }).eq('id', user.id);
      }
      if (vendor) {
        await supabase.from('vendors').update({ password: upgradedHash }).eq('id', vendor.id);
      }
    }

    // Check account status
    if (user && user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your vendor account has been suspended. Please contact admin.' },
        { status: 403 }
      );
    }

    if (vendor && vendor.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your vendor store is suspended. Please contact admin for support.' },
        { status: 403 }
      );
    }

    // Fallback vendor entity if store record hasn't been created yet
    const resolvedVendorId = vendor?.id || user?.id;
    const resolvedShopName = vendor?.shop_name || user?.name || 'Vendor Store';
    const resolvedUserId = user?.id || vendor?.user_id || vendor?.id;
    const resolvedEmail = user?.email || vendor?.email || normalizedEmail;

    const token = jwt.sign(
      {
        id: resolvedUserId,
        email: resolvedEmail,
        role: 'vendor',
        vendor_id: resolvedVendorId,
        shop_name: resolvedShopName,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const now = new Date().toISOString();
    if (user) {
      await supabase.from('users').update({ last_login: now }).eq('id', user.id);
    }
    if (vendor) {
      await supabase.from('vendors').update({ updated_at: now }).eq('id', vendor.id);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: resolvedUserId,
          name: user?.name || vendor?.owner_name || resolvedShopName,
          email: resolvedEmail,
          role: 'vendor',
          status: vendor?.status || user?.status || 'active',
        },
        vendor: {
          id: resolvedVendorId,
          name: resolvedShopName,
          shop_name: resolvedShopName,
          owner_name: vendor?.owner_name || user?.name || 'Vendor',
          email: resolvedEmail,
          phone: vendor?.phone || user?.phone || '',
          status: vendor?.status || 'active',
          verification_badge: vendor?.verification_badge || false,
        },
      },
      { status: 200 }
    );

    response.cookies.set('vendorToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Vendor login error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}