import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '@/lib/authUtils';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin, supabase as fallbackSupabase } from '@/lib/supabase';
import { validate, registerSchema } from '@/lib/validation';

function getSupabaseClient() {
  const admin = getSupabaseAdmin();
  if (admin) return admin;
  return fallbackSupabase;
}

function getJwtSecret() {
  return process.env.JWT_SECRET || '67ece564ef6430be1fe35a05e49d050a0978d05f26db5240c5ef328f69c99811';
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'সঠিক ফরম্যাটে তথ্য প্রদান করুন' }, { status: 400 });
    }

    const { success, data, error: validationError } = validate(registerSchema, body);
    if (!success) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { name, email, password, phone } = data;
    const supabase = getSupabaseClient();

    // 1. Check if email already registered
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে। অনুগ্রহ করে সাইন ইন করুন।' },
        { status: 400 }
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create user in Supabase (only valid table columns)
    const { data: rawUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          status: 'active',
          role: 'customer',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[Register] Supabase insert error:', insertError);
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'ফোন নম্বর বা ইমেইল ইতিমধ্যে ব্যবহার করা হয়েছে' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।' },
        { status: 500 }
      );
    }

    const user = {
      ...rawUser,
      _id: rawUser.id,
      emailVerified: true,
      createdAt: rawUser.created_at,
    };

    // 4. Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.warn('[Register] Welcome email notice:', emailError?.message || emailError);
    }

    // 5. Issue JWT for session
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
          emailVerified: true,
          address: user.address,
          createdAt: user.created_at,
        },
        token,
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
    console.error('[Register] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'সার্ভারে একটি সমস্যা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
