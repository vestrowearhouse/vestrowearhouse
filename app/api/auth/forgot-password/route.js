import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateOTP, sendOtpEmail } from '@/lib/authUtils';

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN = 60 * 1000; // 60 seconds
const MAX_OTP_ATTEMPTS = 3;

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
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }

    // Check if user recently requested OTP (rate limiting - 60 seconds cooldown)
    if (user.last_otp_request && (Date.now() - new Date(user.last_otp_request).getTime()) < OTP_RESEND_COOLDOWN) {
      const timeLeft = Math.ceil((OTP_RESEND_COOLDOWN - (Date.now() - new Date(user.last_otp_request).getTime())) / 1000);
      return NextResponse.json({
        error: `Please wait ${timeLeft} seconds before requesting another OTP.`
      }, { status: 429 });
    }

    // --- Improved OTP attempt logic ---
    let otpAttempts = user.otp_attempts || 0;

    // If the last OTP has expired, reset the attempt counter.
    if (user.reset_password_expire && new Date(user.reset_password_expire).getTime() < Date.now()) {
        otpAttempts = 0;
    }

    // Now check if the user has exceeded max attempts.
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json({
        error: 'Too many OTP requests. Please try again after the current OTP expires.'
      }, { status: 429 });
    }

    const otp = generateOTP();

    // Update user record in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_password_token: otp,
        reset_password_expire: new Date(Date.now() + OTP_EXPIRY).toISOString(),
        otp_attempts: otpAttempts + 1,
        last_otp_request: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw new Error('Failed to update user with OTP.');

    // Send OTP email
    try {
      await sendOtpEmail(email, user.name, otp);
    } catch (emailError) {
      console.error('OTP email send error:', emailError);
      // Provide a more specific error in non-production environments for easier debugging
      const isProduction = process.env.NODE_ENV === 'production';
      const errorMessage = isProduction 
        ? 'Failed to send OTP email. Please try again later.' 
        : `Failed to send OTP email: ${emailError.message}`;

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({
      message: 'OTP sent to your email. It will be valid for 5 minutes.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
