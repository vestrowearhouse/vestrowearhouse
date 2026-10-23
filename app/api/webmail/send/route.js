import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { sendZohoEmail, getZohoConfig } from '@/lib/zohoMail';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // 1. Verify Authentication
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    // 2. Parse Request Body
    const data = await request.json();
    const { to, subject, message, plainText } = data;

    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, message.' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      return NextResponse.json({ error: 'Invalid recipient email address format.' }, { status: 400 });
    }

    // 3. Check Zoho Configuration
    const config = await getZohoConfig();
    if (!config.isConfigured) {
      return NextResponse.json({
        error: 'Zoho Mail is not configured yet. Please configure your Zoho email and App Password in Admin Settings.',
        code: 'NOT_CONFIGURED'
      }, { status: 400 });
    }

    // 4. Send Email via Zoho Mail Transporter
    const result = await sendZohoEmail({
      to: to.trim(),
      subject: subject.trim(),
      message,
      plainText
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      from: result.from,
      message: `Email dispatched successfully to ${to} via Zoho Mail.`
    }, { status: 200 });

  } catch (error) {
    console.error('Zoho Webmail Send Error:', error);

    let clientMessage = error.message || 'Failed to send email. Please check your credentials.';

    if (error.responseCode === 535 || error.message?.includes('535') || error.message?.includes('Authentication Failed')) {
      clientMessage = 'Zoho SMTP authentication failed. If 2FA is enabled or your account is restricted, you must use an Application-Specific Password (App Password) from accounts.zoho.com > Security > App Passwords instead of your account password.';
    } else if (error.responseCode === 553 || error.message?.includes('553') || error.message?.includes('Relaying disallowed')) {
      clientMessage = 'Zoho Mail returned 553 Relaying disallowed: Sender email address must match the authenticated Zoho account.';
    }

    return NextResponse.json({
      error: clientMessage,
      raw: error.message
    }, { status: 500 });
  }
}