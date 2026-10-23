import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request) {
  try {
    
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if OTP is valid (Coverting both to String and trimming spaces for safe comparison)
    if (!user.reset_password_token || String(user.reset_password_token).trim() !== String(otp).trim()) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Check if OTP is expired
    if (!user.reset_password_expire || new Date(user.reset_password_expire).getTime() < Date.now()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // OTP is valid, generate reset token
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'password-reset' },
      process.env.JWT_SECRET || (() => { throw new Error('[Auth] JWT_SECRET not configured'); })(),
      { expiresIn: '15m' }
    );

    // Reset OTP attempts on successful verification
    const { error: updateError } = await supabase
      .from('users')
      .update({
        otp_attempts: 0,
        reset_password_token: null, // Clear the OTP
        reset_password_expire: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      message: 'OTP verified successfully', 
      resetToken,
      email: user.email
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}