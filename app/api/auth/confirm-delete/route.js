import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from '@/lib/secureJwt';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request) {
  try {
    const tokenData = await verifyUserToken(request);
    if (!tokenData || !tokenData.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login again.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const otp = body?.otp;

    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      return NextResponse.json({ error: 'Please enter the 6-digit verification code.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, reset_password_token, reset_password_expire')
      .eq('id', tokenData.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    // Check if token matches
    if (!user.reset_password_token || user.reset_password_token.trim() !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    // Check if expired
    if (!user.reset_password_expire || new Date(user.reset_password_expire).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
    }

    // Delete user from Supabase users table
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      console.error('[DeleteAccount] Supabase delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account. Please try again later.' }, { status: 500 });
    }

    // Clear session cookies
    const response = NextResponse.json({
      success: true,
      message: 'Your account has been deleted permanently.'
    });

    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    return response;
  } catch (error) {
    console.error('[DeleteAccount] Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while deleting your account.' }, { status: 500 });
  }
}
