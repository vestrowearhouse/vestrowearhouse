import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getSupabaseAdmin } from '@/lib/supabase';

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return getSupabaseAdmin();
};

export async function GET(request) {
  try {
    
    // Get token from cookie
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      console.log('[Auth/Me] No token found in cookies - not authenticated');
      return NextResponse.json(
        { user: null, message: 'Not authenticated' },
        { status: 200 }
      );
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || (() => { throw new Error('[Auth] JWT_SECRET not configured'); })()
      );
      console.log('[Auth/Me] Token verified for user:', decoded.email);
    } catch (err) {
      console.error('[Auth/Me] Token verification failed:', err.message);
      return NextResponse.json(
        { user: null, message: 'Invalid token' },
        { status: 200 }
      );
    }

    const supabase = getSupabaseClient();

    // Try to find user by ID first (most reliable) - select only needed fields
    let user = null;
    let role = 'customer';

    if (decoded.id) {
      const { data: foundUser, error: idError } = await supabase
        .from('users')
        .select('id, name, email, phone, avatar, role, status, address, created_at, last_login')
        .eq('id', decoded.id)
        .single();

      if (foundUser && !idError) {
        user = foundUser;
        role = foundUser.role || 'customer';
        console.log('[Auth/Me] User found by ID:', user.email);
      }
    }

    // Fallback: search by email if ID lookup failed
    if (!user && decoded.email) {
      const { data: foundUser, error: emailError } = await supabase
        .from('users')
        .select('id, name, email, phone, avatar, role, status, address, created_at, last_login')
        .eq('email', decoded.email.toLowerCase())
        .single();

      if (foundUser && !emailError) {
        user = foundUser;
        role = foundUser.role || 'customer';
        console.log('[Auth/Me] User found by email:', user.email);
      }
    }

    // If still not found in users, check in 'admins' table (by ID or email)
    if (!user) {
      if (decoded.id) {
        const { data: admin, error: adminIdError } = await supabase
          .from('admins')
          .select('id, name, email, phone, avatar, role, status, address, created_at, last_login')
          .eq('id', decoded.id)
          .single();
          
        if (admin && !adminIdError) {
          user = admin;
          role = 'admin';
          console.log('[Auth/Me] Admin found by ID:', user.email);
        }
      }

      // Fallback to email search for admins
      if (!user && decoded.email) {
        const { data: admin, error: adminEmailError } = await supabase
          .from('admins')
          .select('id, name, email, phone, avatar, role, status, address, created_at, last_login')
          .eq('email', decoded.email.toLowerCase())
          .single();
          
        if (admin && !adminEmailError) {
          user = admin;
          role = 'admin';
        }
      }
    }
    
    if (!user) {
      console.warn('[Auth/Me] User not found for token:', { userId: decoded.id, email: decoded.email });
      return NextResponse.json(
        { user: null, message: 'User not found' },
        { status: 200 }
      );
    }

    if (user.status !== 'active') {
      console.warn('[Auth/Me] User account inactive:', user.email);
      return NextResponse.json(
        { user: null, message: 'Account inactive' },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        _id: user.id, // For frontend compatibility
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: role,
        status: user.status,
        address: user.address,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      }
    });
  } catch (error) {
    console.error('[Auth/Me] Unexpected error:', error);
    return NextResponse.json(
      { user: null, message: 'Auth check error' },
      { status: 200 }
    );
  }
}