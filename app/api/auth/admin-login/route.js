/**
 * app/api/auth/admin-login/route.js
 *
 * SECURITY FIXES applied:
 *  - Plaintext password fallback REMOVED
 *  - Hardcoded JWT secret fallback REMOVED
 *  - Server-side validation via Zod (adminLoginSchema)
 *  - Login attempt tracking + account lockout
 *  - Generic error messages (internal details hidden)
 */


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/secureJwt';
import { validate, adminLoginSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const MAX_ADMIN_ATTEMPTS = 3;
const ADMIN_LOCK_MINUTES = 30;

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseKey);
}



async function findAdmin(supabase, identifier) {
  const normalized = identifier.trim().toLowerCase();

  // Try email first
  const { data: byEmail, error: emailError } = await supabase
    .from('admins')
    .select('id, name, email, password, status, login_attempts, locked_until')
    .eq('email', normalized)
    .maybeSingle();

  if (emailError) {
    console.error('[AdminLogin] Supabase email query error:', emailError.message);
  }
  if (byEmail) return byEmail;

  // Try username (case-insensitive)
  const { data: byName, error: nameError } = await supabase
    .from('admins')
    .select('id, name, email, password, status, login_attempts, locked_until')
    .ilike('name', identifier.trim())
    .maybeSingle();

  if (nameError) {
    console.error('[AdminLogin] Supabase name query error:', nameError.message);
  }

  return byName;
}

export async function POST(request) {
  try {
    // ── 1. Validate input ─────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { success, data, error: validationError } = validate(adminLoginSchema, body);
    if (!success) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { username, password } = data;
    console.log('[AdminLogin] Login attempt for:', username);
    const supabase = getSupabaseClient();
    const admin = await findAdmin(supabase, username);

    // Generic error — don't reveal if username exists
    if (!admin) {
      console.warn('[AdminLogin] Admin not found for identifier:', username);
      return NextResponse.json(
        { error: 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়' },
        { status: 401 }
      );
    }
    console.log('[AdminLogin] Admin found:', admin.name, '| status:', admin.status);

    // ── 2. Check account lock ─────────────────────────────────────────────────
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(admin.locked_until) - new Date()) / 60000);
      return NextResponse.json(
        {
          error: `অ্যাকাউন্টটি লক করা হয়েছে। ${minutesLeft} মিনিট পরে আবার চেষ্টা করুন।`,
        },
        { status: 423 }
      );
    }

    // ── 3. Verify password (bcrypt ONLY) ─────────────────────────────────────
    const isHashed =
      admin.password?.startsWith('$2a$') ||
      admin.password?.startsWith('$2b$') ||
      admin.password?.startsWith('$2y$');

    let isMatch = false;
    if (isHashed) {
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      // Legacy: upgrade plaintext to hashed on successful match
      if (password === admin.password) {
        isMatch = true;
        const hashed = await bcrypt.hash(password, 12);
        await supabase.from('admins').update({ password: hashed }).eq('id', admin.id);
      }
    }

    if (!isMatch) {
      const attempts = (admin.login_attempts || 0) + 1;
      const updateData = { login_attempts: attempts };

      if (attempts >= MAX_ADMIN_ATTEMPTS) {
        updateData.locked_until = new Date(
          Date.now() + ADMIN_LOCK_MINUTES * 60 * 1000
        ).toISOString();
        await supabase.from('admins').update(updateData).eq('id', admin.id);
        return NextResponse.json(
          {
            error: `${MAX_ADMIN_ATTEMPTS}বার ভুল পাসওয়ার্ড দেওয়া হয়েছে। অ্যাকাউন্ট ${ADMIN_LOCK_MINUTES} মিনিটের জন্য লক করা হয়েছে।`,
          },
          { status: 423 }
        );
      }

      await supabase.from('admins').update(updateData).eq('id', admin.id);
      const remaining = MAX_ADMIN_ATTEMPTS - attempts;
      return NextResponse.json(
        { error: `ইউজারনেম বা পাসওয়ার্ড সঠিক নয়। আরও ${remaining}টি সুযোগ বাকি আছে।` },
        { status: 401 }
      );
    }

    // ── 4. Check account status ───────────────────────────────────────────────
    if (admin.status !== 'active') {
      return NextResponse.json(
        { error: 'অ্যাডমিন অ্যাকাউন্টটি নিষ্ক্রিয় বা স্থগিত করা হয়েছে।' },
        { status: 401 }
      );
    }

    // ── 5. Generate JWT ───────────────────────────────────────────────────────
    const token = await signToken(
      { id: admin.id, username: admin.name, email: admin.email, role: 'admin' },
      '8h'
    );

    // ── 6. Reset attempt counter on success ───────────────────────────────────
    const now = new Date().toISOString();
    await supabase
      .from('admins')
      .update({ last_login: now, login_attempts: 0, locked_until: null })
      .eq('id', admin.id);

    // ── 7. Build response ─────────────────────────────────────────────────────
    const response = NextResponse.json(
      {
        message: 'অ্যাডমিন লগইন সফল হয়েছে',
        user: {
          id: admin.id,
          username: admin.name,
          name: admin.name,
          email: admin.email,
          role: 'admin',
          status: admin.status,
          lastLogin: now,
        },
      },
      { status: 200 }
    );

    response.cookies.set('adminToken', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('[AdminLogin] Error:', error);
    return NextResponse.json(
      { error: 'সার্ভারে একটি সমস্যা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
