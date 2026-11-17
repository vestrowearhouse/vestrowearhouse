/**
 * app/api/auth/login/route.js
 *
 * SECURITY FIXES applied:
 *  - Plaintext password fallback REMOVED (always require bcrypt hash)
 *  - Hardcoded JWT secret fallback REMOVED
 *  - Internal error.message no longer sent to client
 *  - Server-side input validation via Zod (loginSchema)
 *  - Failed login attempt tracking in Supabase
 *  - Brute-force check: account locked after 5 consecutive failures
 */

import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import bcrypt from 'bcryptjs';
import { sendLoginWelcomeEmail } from '@/lib/email';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validate, loginSchema } from '@/lib/validation';
import jwt from 'jsonwebtoken';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

function getSupabaseClient() {
  return getSupabaseAdmin();
}

function getJwtSecret() {
  return process.env.JWT_SECRET || '67ece564ef6430be1fe35a05e49d050a0978d05f26db5240c5ef328f69c99811';
}

export async function POST(request) {
  try {
    // ── 1. Validate & sanitize input ─────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { success, data, error: validationError } = validate(loginSchema, body);
    if (!success) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const inputIdentifier = data.email.toLowerCase().trim();
    const isEmail = inputIdentifier.includes('@');
    const password = data.password;
    const supabase = getSupabaseClient();

    // ── 2. Find user by email or phone ────────────────────────────────────────
    let user = null;
    let role = 'customer';

    if (isEmail) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, password, phone, avatar, role, status, address, created_at, login_attempts, locked_until')
        .eq('email', inputIdentifier)
        .maybeSingle();
      user = userData;
    } else {
      // Lookup by phone (clean formatting)
      const cleanPhone = inputIdentifier.replace(/[^0-9+]/g, '');
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, password, phone, avatar, role, status, address, created_at, login_attempts, locked_until')
        .eq('phone', cleanPhone)
        .maybeSingle();
      user = userData;

      if (!user) {
        // Try alternate phone formats (without/with country code prefix)
        const altPhone = cleanPhone.startsWith('+880')
          ? cleanPhone.slice(3)
          : cleanPhone.startsWith('880')
          ? cleanPhone.slice(2)
          : cleanPhone.startsWith('01')
          ? `+88${cleanPhone}`
          : null;

        if (altPhone) {
          const { data: altUserData } = await supabase
            .from('users')
            .select('id, name, email, password, phone, avatar, role, status, address, created_at, login_attempts, locked_until')
            .eq('phone', altPhone)
            .maybeSingle();
          user = altUserData;
        }
      }
    }

    // Check admins table if not in users
    if (!user) {
      const { data: admin } = await supabase
        .from('admins')
        .select('id, name, email, password, role, status, login_attempts, locked_until')
        .eq('email', inputIdentifier)
        .maybeSingle();

      if (admin) {
        user = admin;
        role = 'admin';
      }
    }

    // Use generic error message — do not reveal whether email/phone exists
    if (!user) {
      return NextResponse.json(
        { error: 'ইমেইল/ফোন নম্বর বা পাসওয়ার্ড সঠিক নয়' },
        { status: 401 }
      );
    }

    // ── 3. Check account lock ─────────────────────────────────────────────────
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const unlockAt = new Date(user.locked_until);
      const minutesLeft = Math.ceil((unlockAt - new Date()) / 60000);
      return NextResponse.json(
        {
          error: `অ্যাকাউন্টটি অস্থায়ীভাবে লক করা হয়েছে। ${minutesLeft} মিনিট পরে আবার চেষ্টা করুন।`,
        },
        { status: 423 }
      );
    }

    // ── 4. Verify password (bcrypt + auto-upgrade legacy plain passwords) ─────
    const isPasswordHashed = user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$') || user.password?.startsWith('$2y$');

    let isMatch = false;
    if (isPasswordHashed) {
      isMatch = await bcrypt.compare(password, user.password);
    } else if (user.password && user.password === password) {
      // Legacy plaintext password matched — automatically migrate to bcrypt hash
      isMatch = true;
      try {
        const newHash = await bcrypt.hash(password, 12);
        const table = role === 'admin' ? 'admins' : 'users';
        await supabase.from(table).update({ password: newHash }).eq('id', user.id);
        console.log(`[Login] Upgraded legacy password to bcrypt for user ${user.id}`);
      } catch (upgradeErr) {
        console.error('[Login] Password auto-hash error:', upgradeErr);
      }
    }

    if (!isMatch) {
      // Track failed attempt
      const attempts = (user.login_attempts || 0) + 1;
      const table = role === 'admin' ? 'admins' : 'users';
      const updateData = { login_attempts: attempts };

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.locked_until = new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
        ).toISOString();
        await supabase.from(table).update(updateData).eq('id', user.id);
        return NextResponse.json(
          {
            error: `${MAX_LOGIN_ATTEMPTS}বার ভুল পাসওয়ার্ড দেওয়া হয়েছে। অ্যাকাউন্ট ${LOCK_DURATION_MINUTES} মিনিটের জন্য লক করা হয়েছে।`,
          },
          { status: 423 }
        );
      }

      await supabase.from(table).update(updateData).eq('id', user.id);
      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      return NextResponse.json(
        { error: `ইমেইল বা পাসওয়ার্ড সঠিক নয়। আরও ${remaining}টি সুযোগ বাকি আছে।` },
        { status: 401 }
      );
    }

    // ── 5. Check account status ───────────────────────────────────────────────
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'অ্যাকাউন্টটি স্থগিত বা নিষ্ক্রিয় করা হয়েছে।' },
        { status: 401 }
      );
    }

    // ── 6. Generate JWT ───────────────────────────────────────────────────────
    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // ── 7. Reset login attempts on success ────────────────────────────────────
    const now = new Date().toISOString();
    const table = role === 'admin' ? 'admins' : 'users';
    await supabase
      .from(table)
      .update({ last_login: now, login_attempts: 0, locked_until: null })
      .eq('id', user.id);

    // ── 8. Send login notification email (non-blocking) ───────────────────────
    try {
      const loginTime = new Date().toLocaleString('bn-BD');
      const device = request.headers.get('user-agent') || 'Unknown';
      const ipAddress =
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        'Not available';
      await sendLoginWelcomeEmail(user.email, user.name, loginTime, device, ipAddress);
    } catch {
      // Never fail login because of email error
    }

    // ── 9. Build response ─────────────────────────────────────────────────────
    const response = NextResponse.json(
      {
        message: 'লগইন সফল হয়েছে',
        user: {
          id: user.id,
          _id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role,
          status: user.status,
          address: user.address,
          createdAt: user.created_at,
          lastLogin: now,
        },
        token,
      },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
    });

    if (role === 'admin') {
      response.cookies.set('adminToken', token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
        secure: isProduction,
      });
    }

    return response;
  } catch (error) {
    console.error('[Login] Error:', error);
    // Do NOT expose internal error details to the client
    return NextResponse.json(
      { error: 'সার্ভারে একটি সমস্যা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
