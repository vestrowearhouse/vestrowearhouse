/**
 * app/api/auth/register/route.js
 *
 * SECURITY FIXES applied:
 *  - Server-side password strength validation (Zod registerSchema)
 *  - Input sanitization to prevent XSS
 *  - Hardcoded JWT secret fallback REMOVED
 *  - Internal error.message no longer exposed to client
 *  - bcrypt always enforced (no try/catch that silently falls back to plaintext)
 */


import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '@/lib/authUtils';
import { verifyAdminToken } from '@/lib/secureJwt';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { validate, registerSchema } from '@/lib/validation';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseKey);
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is not configured properly');
  }
  return secret;
}

export async function POST(request) {
  try {
    // ── 1. Parse & validate input ─────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { success, data, error: validationError } = validate(registerSchema, body);
    if (!success) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { name, email, password, phone } = data;
    const supabase = getSupabaseClient();

    // ── 2. Check if email already registered ──────────────────────────────────
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে' },
        { status: 400 }
      );
    }

    // ── 3. Hash password (always — no fallback) ───────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── 4. Create user ────────────────────────────────────────────────────────
    const { data: rawUser, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          status: 'active',
          email_verified: true,
          role: 'customer',
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'ফোন নম্বর বা ইমেইল ইতিমধ্যে ব্যবহার করা হয়েছে' },
          { status: 400 }
        );
      }
      // Log internally but don't expose DB error details to client
      console.error('[Register] DB error:', error);
      return NextResponse.json(
        { error: 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।' },
        { status: 500 }
      );
    }

    const user = {
      ...rawUser,
      _id: rawUser.id,
      emailVerified: rawUser.email_verified,
      createdAt: rawUser.created_at,
    };

    // ── 5. Send welcome email (non-blocking) ──────────────────────────────────
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('[Register] Welcome email failed:', emailError);
    }

    // ── 6. Issue JWT for immediate login ──────────────────────────────────────
    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      {
        message: 'আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          address: user.address,
          createdAt: user.created_at,
        },
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'সার্ভারে একটি সমস্যা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
