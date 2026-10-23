import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from '@/lib/secureJwt';
import { sendEmail } from '@/lib/email';

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

    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', tokenData.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_password_token: otp,
        reset_password_expire: expiry,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[DeleteAccount] Failed to store OTP:', updateError);
      return NextResponse.json({ error: 'Failed to generate security code.' }, { status: 500 });
    }

    // Send email via Resend
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">StellarMartBD</h1>
          <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">Security & Account Verification</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Account Deletion Confirmation</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hello <strong>${user.name || 'User'}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">We received a request to permanently delete your account on StellarMartBD. If this was you, please use the following 6-digit confirmation code:</p>
          
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626; font-family: monospace;">${otp}</span>
            <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">Valid for 10 minutes only</p>
          </div>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="color: #991b1b; font-size: 13px; margin: 0; line-height: 1.5;">
              <strong>Warning:</strong> Deleting your account will permanently erase your order history, profile data, and saved addresses.
            </p>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you did not request this, please ignore this email and your account will remain safe.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} StellarMartBD. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail(
      user.email,
      '🔐 Your Account Deletion Code: ' + otp + ' - StellarMartBD',
      html
    );

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${user.email}.`
    });

  } catch (error) {
    console.error('[DeleteAccount] OTP send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
}
