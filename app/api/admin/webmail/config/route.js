import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { getZohoConfig, saveZohoConfig, verifyZohoConnection } from '@/lib/zohoMail';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const config = await getZohoConfig();

    return NextResponse.json({
      success: true,
      config: {
        user: config.user || '',
        host: config.host || 'smtp.zoho.com',
        port: config.port || 465,
        fromName: config.fromName || 'StellarMartBD',
        isConfigured: config.isConfigured,
        hasPassword: Boolean(config.pass),
        maskedPass: config.pass ? '••••••••••••••••' : ''
      }
    });
  } catch (error) {
    console.error('Failed to get Zoho config:', error);
    return NextResponse.json({ error: 'Failed to retrieve Zoho Mail configuration.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { user, pass, host = 'smtp.zoho.com', port = 465, fromName = 'StellarMartBD' } = body;

    if (!user) {
      return NextResponse.json({ error: 'Zoho Mail user/email address is required.' }, { status: 400 });
    }

    // If pass is omitted or masked, retain existing password
    const existing = await getZohoConfig();
    let finalPass = pass;
    if (!finalPass || finalPass.includes('••••')) {
      finalPass = existing.pass;
    }

    if (!finalPass) {
      return NextResponse.json({ error: 'Zoho Mail password or App Password is required.' }, { status: 400 });
    }

    const newConfig = {
      user: user.trim(),
      pass: finalPass.trim(),
      host: (host || 'smtp.zoho.com').trim(),
      port: Number(port) || 465,
      fromName: (fromName || 'StellarMartBD').trim()
    };

    // Save configuration
    await saveZohoConfig(newConfig);

    // Verify connection in real-time
    const testResult = await verifyZohoConnection(newConfig);

    return NextResponse.json({
      success: true,
      message: testResult.connected 
        ? 'Zoho Mail configured and verified successfully!' 
        : 'Zoho credentials saved, but connection check returned a warning.',
      connection: testResult,
      config: {
        user: newConfig.user,
        host: newConfig.host,
        port: newConfig.port,
        fromName: newConfig.fromName,
        isConfigured: true,
        hasPassword: true
      }
    });
  } catch (error) {
    console.error('Failed to save Zoho config:', error);
    return NextResponse.json({ error: error.message || 'Failed to save Zoho Mail configuration.' }, { status: 500 });
  }
}
