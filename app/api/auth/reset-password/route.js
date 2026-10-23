import { NextResponse } from 'next/server';
import { verifyAdminToken , verifyToken } from '@/lib/secureJwt';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { sendResetSuccessEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
};

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
    
    const { resetToken, newPassword, confirmPassword } = await request.json();

    if (!resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Token, password, and confirm password required' }, { status: 400 });
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // Validate password strength
    const validationError = validatePassword(newPassword);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Verify token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || (() => { throw new Error('[Auth] JWT_SECRET not configured'); })());
    
    if (decoded.type !== 'password-reset') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }
    
    const supabase = getSupabaseClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Hash new password with salt rounds 12
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expire: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Send success email
    try {
      await sendResetSuccessEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Password reset success email failed:', emailError);
      // Don't fail if email doesn't send
    }

    return NextResponse.json({ message: 'Password reset successful. You can now login with your new password.' });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Reset token expired. Please request a new password reset.' }, { status: 400 });
    }
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
    }
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Password reset failed. Please try again.' }, { status: 500 });
  }
}