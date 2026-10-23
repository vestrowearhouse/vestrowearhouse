import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from '@/lib/secureJwt';
import bcrypt from 'bcryptjs';
import { sendResetSuccessEmail } from '@/lib/email';

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
      return NextResponse.json({ error: 'Unauthorized. Please log in again.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New password and confirmation do not match.' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from current password.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('id', tokenData.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    // Verify current password
    let isMatch = false;
    const isPasswordHashed = user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$') || user.password?.startsWith('$2y$');
    
    if (isPasswordHashed) {
      isMatch = await bcrypt.compare(currentPassword, user.password);
    } else if (user.password && user.password === currentPassword) {
      // Legacy plaintext migration support
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect. Please check and try again.' }, { status: 400 });
    }

    // Hash the new password with salt rounds 12
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[ChangePassword] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update password. Please try again later.' }, { status: 500 });
    }

    // Attempt to send confirmation security email
    try {
      if (user.email) {
        await sendResetSuccessEmail(user.email, user.name);
      }
    } catch (emailErr) {
      console.warn('[ChangePassword] Notification email failed:', emailErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully! You can now use your new password.'
    });

  } catch (error) {
    console.error('[ChangePassword] Error:', error);
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
