/**
 * app/api/admin/setup-admin/route.js
 *
 * Utility to:
 *  GET  — check env vars status
 *  POST — create or update admin user (bcrypt password)
 *
 * Protected by SETUP_SECRET env variable.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ SECURITY: Only return boolean status — never expose key lengths or values
  const jwtSecret = process.env.JWT_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Verify DB connectivity without leaking admin data
  let dbConnected = false;
  let dbError = null;
  let adminCount = 0;
  let hasPlaintextPasswords = false;
  try {
    const key = supabaseServiceKey || supabaseAnonKey;
    if (supabaseUrl && key) {
      const sb = createClient(supabaseUrl, key);
      const { data, error } = await sb
        .from('admins')
        .select('id, password')
        .limit(50);
      if (error) {
        dbError = 'Database connection error';
      } else {
        dbConnected = true;
        adminCount = (data || []).length;
        // Check for plaintext passwords without exposing them
        hasPlaintextPasswords = (data || []).some(
          (a) => a.password && !a.password.startsWith('$2')
        );
      }
    }
  } catch {
    dbError = 'Database connection error';
  }

  return NextResponse.json({
    env: {
      JWT_SECRET: jwtSecret ? '✅ Set' : '❌ MISSING — admin login will fail!',
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ MISSING',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? '✅ Set' : '❌ MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ Set' : '❌ MISSING',
    },
    database: {
      connected: dbConnected,
      error: dbError,
      adminCount,
      hasPlaintextPasswords,
      warning: hasPlaintextPasswords
        ? '⚠️ Some admins have plaintext passwords — POST with action:"hash-passwords" to fix'
        : null,
    },
    instructions:
      'POST with {secret, action:"hash-passwords"} to fix plaintext passwords. Or POST with {secret, name, email, password} to create/reset an admin.',
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { secret, action, name, email, password } = body;

    const SETUP_SECRET = process.env.SETUP_SECRET;
    if (!SETUP_SECRET) {
      return NextResponse.json({ error: 'SETUP_SECRET not configured.' }, { status: 500 });
    }
    if (secret !== SETUP_SECRET) {
      return NextResponse.json({ error: 'Invalid setup secret.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration.' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Action: hash all plaintext passwords ──────────────────────
    if (action === 'hash-passwords') {
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id, name, email, password');

      if (error) throw error;

      const results = [];
      for (const admin of admins || []) {
        const isHashed = admin.password?.startsWith('$2a$') ||
          admin.password?.startsWith('$2b$') ||
          admin.password?.startsWith('$2y$');

        if (!isHashed && admin.password) {
          const hashed = await bcrypt.hash(admin.password, 12);
          const { error: updateError } = await supabase
            .from('admins')
            .update({ password: hashed })
            .eq('id', admin.id);
          results.push({
            name: admin.name,
            email: admin.email,
            status: updateError ? `❌ Failed: ${updateError.message}` : '✅ Password hashed',
          });
        } else {
          results.push({
            name: admin.name,
            email: admin.email,
            status: '✅ Already hashed (skipped)',
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Password hashing complete. Try admin login now.',
        results,
      });
    }

    // ── Action: create or update admin ────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email, password required.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('admins')
        .update({ name, password: hashedPassword, status: 'active', login_attempts: 0, locked_until: null })
        .eq('id', existing.id)
        .select('id, name, email, status')
        .single();
      if (error) throw error;
      result = { action: 'updated', admin: data };
    } else {
      const { data, error } = await supabase
        .from('admins')
        .insert({ name, email: email.toLowerCase().trim(), password: hashedPassword, status: 'active', login_attempts: 0 })
        .select('id, name, email, status')
        .single();
      if (error) throw error;
      result = { action: 'created', admin: data };
    }

    return NextResponse.json({
      success: true,
      message: `Admin ${result.action} successfully. Login now with bcrypt password.`,
      admin: result.admin,
    });
  } catch (error) {
    console.error('[SetupAdmin]', error);
    // ✅ SECURITY: Never leak internal error details to client
    return NextResponse.json({ error: 'Setup operation failed. Check server logs.' }, { status: 500 });
  }
}
