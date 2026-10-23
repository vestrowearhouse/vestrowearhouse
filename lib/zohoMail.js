import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ZOHO_CONFIG_SLUG = 'system-zoho-mail';

let _cachedZohoSupabase = null;

const getSupabase = () => {
  if (_cachedZohoSupabase) return _cachedZohoSupabase;
  _cachedZohoSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return _cachedZohoSupabase;
};

/**
 * Retrieve Zoho Mail configuration from environment variables or Supabase DB
 */
export async function getZohoConfig() {
  let user = process.env.ZOHO_MAIL_USER || 'support@stellarmartbd.com';
  let pass = process.env.ZOHO_MAIL_PASS || 'rJkK2TXF0gGP';
  let host = process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com';
  let port = Number(process.env.ZOHO_MAIL_PORT) || 465;
  let fromName = process.env.ZOHO_MAIL_FROM_NAME || 'StellarMartBD';

  // If not configured in process.env, check DB
  if (!user || !pass) {
    try {
      const supabase = getSupabase();
      const { data: row } = await supabase
        .from('categories')
        .select('id, custom_code, status')
        .eq('slug', ZOHO_CONFIG_SLUG)
        .maybeSingle();

      if (row?.custom_code) {
        const parsed = JSON.parse(row.custom_code);
        if (parsed.user) user = parsed.user;
        if (parsed.pass) pass = parsed.pass;
        if (parsed.host) host = parsed.host;
        if (parsed.port) port = Number(parsed.port) || 465;
        if (parsed.fromName) fromName = parsed.fromName;
      }
    } catch (e) {
      console.warn('Failed to load Zoho config from database:', e.message);
    }
  }

  // Guaranteed fallback
  if (!user) user = 'support@stellarmartbd.com';
  if (!pass) pass = 'rJkK2TXF0gGP';

  return {
    user: user.trim(),
    pass: pass.trim(),
    host: host.trim() || 'smtp.zoho.com',
    port: port || 465,
    fromName: fromName.trim() || 'StellarMartBD',
    isConfigured: true
  };
}

/**
 * Save Zoho Mail configuration to Supabase and optionally update .env.local
 */
export async function saveZohoConfig({ user, pass, host = 'smtp.zoho.com', port = 465, fromName = 'StellarMartBD' }) {
  const supabase = getSupabase();
  const configObj = {
    user: (user || '').trim(),
    pass: (pass || '').trim(),
    host: (host || 'smtp.zoho.com').trim(),
    port: Number(port) || 465,
    fromName: (fromName || 'StellarMartBD').trim(),
    updated_at: new Date().toISOString()
  };

  const payloadStr = JSON.stringify(configObj);

  // Check if row already exists in categories table
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', ZOHO_CONFIG_SLUG)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('categories')
      .update({
        custom_code: payloadStr,
        status: configObj.user && configObj.pass ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('categories')
      .insert({
        name: 'System Zoho Mail Config',
        slug: ZOHO_CONFIG_SLUG,
        custom_code: payloadStr,
        status: configObj.user && configObj.pass ? 'active' : 'inactive'
      });

    if (error) throw error;
  }

  // Update in-memory process.env so immediately available in current server instance
  if (configObj.user) process.env.ZOHO_MAIL_USER = configObj.user;
  if (configObj.pass) process.env.ZOHO_MAIL_PASS = configObj.pass;
  if (configObj.host) process.env.ZOHO_MAIL_HOST = configObj.host;
  if (configObj.port) process.env.ZOHO_MAIL_PORT = String(configObj.port);
  if (configObj.fromName) process.env.ZOHO_MAIL_FROM_NAME = configObj.fromName;

  // If local .env.local exists, update or append for permanent local persistence
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');

      const updateKey = (key, val) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}="${val}"`);
        } else {
          envContent += `\n${key}="${val}"`;
        }
      };

      if (configObj.user) updateKey('ZOHO_MAIL_USER', configObj.user);
      if (configObj.pass) updateKey('ZOHO_MAIL_PASS', configObj.pass);
      if (configObj.host) updateKey('ZOHO_MAIL_HOST', configObj.host);
      if (configObj.port) updateKey('ZOHO_MAIL_PORT', configObj.port);
      if (configObj.fromName) updateKey('ZOHO_MAIL_FROM_NAME', configObj.fromName);

      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    }
  } catch (err) {
    console.warn('Could not update .env.local file:', err.message);
  }

  return { success: true };
}

/**
 * Create a Nodemailer transporter instance
 */
export function createZohoTransporter(config) {
  const isPort465 = Number(config.port) === 465;

  return nodemailer.createTransport({
    host: config.host || 'smtp.zoho.com',
    port: Number(config.port) || 465,
    secure: isPort465, // SSL for 465, TLS/STARTTLS for 587
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Verify Zoho Mail connection with given or stored credentials
 */
export async function verifyZohoConnection(customConfig = null) {
  const config = customConfig || (await getZohoConfig());

  if (!config.user || !config.pass) {
    return {
      connected: false,
      error: 'Zoho Mail user or password is missing. Please configure your credentials.'
    };
  }

  const transporter = createZohoTransporter(config);

  try {
    await transporter.verify();
    return {
      connected: true,
      message: `Successfully connected to Zoho Mail (${config.user})`
    };
  } catch (error) {
    console.error('Zoho SMTP Verification Failed:', error);
    let errorHelp = error.message;

    if (error.responseCode === 535 || error.message?.includes('535') || error.message?.includes('Authentication Failed')) {
      errorHelp = 'Authentication failed. If 2FA/TFA is active on your Zoho account, you MUST use an Application-Specific Password (App Password) from accounts.zoho.com > Security > App Passwords instead of your regular password.';
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      errorHelp = `Connection timeout to ${config.host}:${config.port}. Check if port ${config.port} or firewall is permitted.`;
    }

    return {
      connected: false,
      error: errorHelp,
      rawError: error.message
    };
  }
}

/**
 * Send an email via Zoho Mail with a branded template
 */
export async function sendZohoEmail({ to, subject, message, plainText = '' }) {
  const config = await getZohoConfig();

  if (!config.isConfigured) {
    throw new Error('Zoho Mail is not configured. Please configure your Zoho Mail credentials in the Admin Panel or .env.local.');
  }

  const transporter = createZohoTransporter(config);

  // Branded HTML wrapper
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject || 'Stellar Mart BD'}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1d4ed8, #2563eb, #0284c7); padding: 22px 32px; text-align: left;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="48" style="vertical-align: middle; padding-right: 14px;">
                        <img src="https://www.stellarmartbd.com/icons/icon-192x192.png" width="44" height="44" alt="Stellar Mart BD" style="display: block; border-radius: 10px; border: 2px solid rgba(255,255,255,0.4); background-color: #ffffff; object-fit: contain;" />
                      </td>
                      <td style="vertical-align: middle;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Stellar Mart BD</h1>
                        <p style="margin: 3px 0 0 0; color: #bfdbfe; font-size: 12px; font-weight: 500;">Customer Care & Support</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 32px; font-size: 15px; color: #334155;">
                  ${message}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
                    This email was sent from <strong>${config.fromName}</strong> (${config.user})
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                    Dhaka, Bangladesh • <a href="https://stellarmartbd.com" style="color: #2563eb; text-decoration: none;">stellarmartbd.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${config.fromName}" <${config.user}>`,
    to,
    subject,
    html: htmlContent,
    text: plainText || message.replace(/<[^>]+>/g, ' '),
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    from: config.user
  };
}
