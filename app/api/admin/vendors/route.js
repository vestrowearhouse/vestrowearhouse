import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }

  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const supabase = getSupabaseClient();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let query = supabase
      .from('vendors')
      .select(`
        id,
        user_id,
        username,
        shop_name,
        owner_name,
        email,
        phone,
        shop_address,
        description,
        logo_url,
        status,
        is_verified,
        verification_badge,
        created_at,
        updated_at,
        users:user_id (
          id,
          email,
          status
        )
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`shop_name.ilike.%${search}%,owner_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        vendors: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { 
      shop_name, 
      owner_name, 
      email, 
      phone, 
      password, 
      username,
      shop_address,
      description,
      logo_url,
      status = 'active',
      verification_badge = false,
      is_verified = false
    } = await request.json();

    // Validation
    if (!shop_name || !owner_name || !email || !password) {
      return NextResponse.json(
        { error: 'Shop name, owner name, email, and password are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in users or vendors
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email is already registered.' },
        { status: 400 }
      );
    }

    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingVendor) {
      return NextResponse.json(
        { error: 'A vendor store with this email already exists.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanPhoneStr = phone ? String(phone).trim() : null;
    const cleanPhoneNum = phone ? parseInt(String(phone).replace(/\D/g, ''), 10) || null : null;
    const resolvedUsername = (username && username.trim()) 
      ? username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') 
      : shop_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Create user account with vendor role
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          name: owner_name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          phone: cleanPhoneStr,
          address: shop_address ? shop_address.trim() : null,
          role: 'vendor',
          status: status || 'active',
          email_verified: true, // Auto-verify for admin-created accounts
        },
      ])
      .select()
      .single();

    if (userError || !newUser) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: `Failed to create user account: ${userError?.message || 'Database error'}` },
        { status: 400 }
      );
    }

    // 2. Create vendor profile
    const { data: newVendor, error: vendorError } = await supabase
      .from('vendors')
      .insert([
        {
          user_id: newUser.id,
          username: resolvedUsername,
          shop_name: shop_name.trim(),
          owner_name: owner_name.trim(),
          email: normalizedEmail,
          phone: cleanPhoneNum,
          shop_address: shop_address ? shop_address.trim() : null,
          description: description ? description.trim() : null,
          logo_url: logo_url ? logo_url.trim() : null,
          status: status || 'active',
          verification_badge: Boolean(verification_badge || is_verified),
          is_verified: Boolean(verification_badge || is_verified),
          password: hashedPassword,
        },
      ])
      .select()
      .single();

    if (vendorError || !newVendor) {
      console.error('Vendor creation error:', vendorError);
      // Clean up the user if vendor creation fails
      await supabase.from('users').delete().eq('id', newUser.id);
      return NextResponse.json(
        { error: `Failed to create vendor profile: ${vendorError?.message || 'Database error'}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Vendor store "${newVendor.shop_name}" created successfully!`,
        vendor: newVendor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Vendor creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
