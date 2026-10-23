import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getZohoConfig, verifyZohoConnection, sendZohoEmail } from '@/lib/zohoMail';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { user, pass, host, port, fromName, sendTestEmail, testRecipient } = body;

    let targetConfig;
    if (user && pass) {
      targetConfig = {
        user: user.trim(),
        pass: pass.trim(),
        host: (host || 'smtp.zoho.com').trim(),
        port: Number(port) || 465,
        fromName: (fromName || 'StellarMartBD').trim()
      };
    } else {
      targetConfig = await getZohoConfig();
      if (user) targetConfig.user = user.trim();
      if (pass && !pass.includes('••••')) targetConfig.pass = pass.trim();
      if (host) targetConfig.host = host.trim();
      if (port) targetConfig.port = Number(port);
      if (fromName) targetConfig.fromName = fromName.trim();
    }

    if (!targetConfig.user || !targetConfig.pass) {
      return NextResponse.json({
        connected: false,
        error: 'Missing Zoho email or password/App Password.'
      }, { status: 400 });
    }

    // 1. Verify SMTP handshake
    const verifyResult = await verifyZohoConnection(targetConfig);
    if (!verifyResult.connected) {
      return NextResponse.json(verifyResult, { status: 400 });
    }

    // 2. Optionally dispatch a test email
    let testEmailResult = null;
    if (sendTestEmail) {
      const recipient = testRecipient || targetConfig.user;
      testEmailResult = await sendZohoEmail({
        to: recipient,
        subject: '✓ Zoho Mail SMTP Test - Stellar Mart BD',
        message: `
          <div style="text-align: center; padding: 12px 0;">
            <div style="display: inline-block; width: 48px; height: 48px; background: #ecfdf5; border-radius: 50%; line-height: 48px; font-size: 24px; color: #059669; margin-bottom: 12px;">✓</div>
            <h2 style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700;">Zoho Mail Connected!</h2>
            <p style="color: #64748b; font-size: 14px; margin: 8px 0 20px 0;">Your admin panel email sending integration is working perfectly.</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Sender Account:</strong> ${targetConfig.user}</p>
            <p style="margin: 4px 0;"><strong>SMTP Server:</strong> ${targetConfig.host}:${targetConfig.port}</p>
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 24px;">You can now compose and send emails to any customer directly from Stellar Mart BD Admin Panel.</p>
        `
      });
    }

    return NextResponse.json({
      connected: true,
      message: sendTestEmail 
        ? `Connection verified! A test email has been sent to ${testRecipient || targetConfig.user}.`
        : `Successfully authenticated with Zoho SMTP (${targetConfig.user}).`,
      details: testEmailResult
    });
  } catch (error) {
    console.error('Zoho test connection error:', error);
    return NextResponse.json({
      connected: false,
      error: error.message || 'Failed to verify Zoho connection.'
    }, { status: 500 });
  }
}
