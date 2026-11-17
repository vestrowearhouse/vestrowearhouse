const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const welcomeEmailHTML = (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Vestro Wear House!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fafafa; padding: 40px 20px; border-radius: 0 0 8px 8px; border: 1px solid #eee; border-top: none; }
    .button { background: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
    h1 { margin: 0 0 10px 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome, ${name}!</h1>
    <p style="margin: 0; color: #bbb; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Vestro Wear House • Premium Streetwear</p>
  </div>
  <div class="content">
    <h2 style="font-size: 18px; margin-top: 0;">Your Account is Ready</h2>
    <p>We're thrilled to welcome you to Vestro Wear House. Explore curated luxury streetwear and modern essentials.</p>
    <ul style="padding-left: 20px; color: #444; font-size: 14px;">
      <li>Exclusive Streetwear Drops</li>
      <li>Instant Checkout & Easy Tracking</li>
      <li>Cash on Delivery & Nationwide Shipping</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/shop" class="button">Explore Collections</a>
    </div>
  </div>
  <div class="footer">
    <p>Vestro Wear House — Dhaka, Bangladesh</p>
    <p><a href="${baseUrl}/contact" style="color: #666;">Contact Us</a> | <a href="${baseUrl}/privacy" style="color: #666;">Privacy</a></p>
  </div>
</body>
</html>
`;

export const otpEmailHTML = (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your OTP Code - Vestro Wear House</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fafafa; padding: 40px 20px; border-radius: 0 0 8px 8px; text-align: center; border: 1px solid #eee; border-top: none; }
    .otp-box { background: white; border: 2px solid #000; border-radius: 6px; font-size: 32px; font-weight: bold; color: #000; letter-spacing: 8px; margin: 25px auto; padding: 15px 30px; width: 280px; font-family: monospace; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
    h1 { margin: 0 0 10px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
    .expires { color: #dc2626; font-weight: 600; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset Request</h1>
  </div>
  <div class="content">
    <h2 style="font-size: 16px;">Hi ${name},</h2>
    <p>Use this one-time password (OTP) to reset your password:</p>
    <div class="otp-box">${otp}</div>
    <p class="expires">Valid for 10 minutes only</p>
    <p style="color: #777; font-size: 13px;">If you didn't request this, ignore this email.</p>
  </div>
  <div class="footer">
    <p>Vestro Wear House Security Team</p>
  </div>
</body>
</html>
`;

export const resetSuccessHTML = (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset Successful - Vestro Wear House</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fafafa; padding: 40px; text-align: center; border: 1px solid #eee; border-radius: 8px;">
    <h1 style="color: #000; text-transform: uppercase; letter-spacing: 1px; font-size: 22px;">Password Updated!</h1>
    <p>Hi ${name}, your password has been successfully reset.</p>
    <p><a href="${baseUrl}/login" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 13px; display: inline-block; margin-top: 15px;">Sign In Now</a></p>
    <p style="color: #888; font-size: 12px; margin-top: 30px;">Vestro Wear House Security Team</p>
  </div>
</body>
</html>
`;

export const emailVerificationHTML = (name, verificationLink) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Email - Vestro Wear House</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fafafa; padding: 40px 20px; border-radius: 0 0 8px 8px; border: 1px solid #eee; border-top: none; }
    .button { background: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 700; text-transform: uppercase; font-size: 13px; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
    h1 { margin: 0 0 10px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Verify Your Email</h1>
    <p style="margin: 0; color: #bbb; font-size: 13px;">Welcome to Vestro Wear House, ${name}!</p>
  </div>
  <div class="content">
    <h2 style="font-size: 16px;">Almost there!</h2>
    <p>Thanks for signing up. Please verify your email address to complete your registration.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" class="button">Verify Email Address</a>
    </div>
    <p>This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  </div>
  <div class="footer">
    <p>StellarMartBD - Bangladesh's Premium Online Marketplace</p>
    <p><a href="${baseUrl}/contact">Contact Us</a> | <a href="${baseUrl}/privacy">Privacy</a></p>
  </div>
</body>
</html>
`;

export const loginWelcomeEmailHTML = (name, loginTime, device, ipAddress) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome Back to StellarMartBD</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #f0fdf4; padding: 40px 20px; border-radius: 0 0 12px 12px; }
    .info-box { background: white; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    h1 { margin: 0 0 10px 0; font-size: 28px; }
    .security-note { background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; color: #92400e; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome Back, ${name}! 👋</h1>
    <p>Your login was successful</p>
  </div>
  <div class="content">
    <h2>Login Details</h2>
    <div class="info-box">
      <p><strong>⏰ Login Time:</strong> ${loginTime}</p>
      <p><strong>📱 Device:</strong> ${device || 'Unknown'}</p>
      <p><strong>🌐 IP Address:</strong> ${ipAddress || 'Not available'}</p>
    </div>
    
    <p>Your account is secure. If you didn't make this login attempt or don't recognize the device/IP address, please reset your password immediately.</p>
    
    <div class="security-note">
      <strong>🔒 Security Tip:</strong> Never share your password with anyone. We will never ask for your password via email.
    </div>
    
    <p style="margin-top: 30px; text-align: center;">
      <a href="${baseUrl}/shop" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Continue Shopping
      </a>
    </p>
  </div>
  <div class="footer">
    <p>StellarMartBD - Bangladesh's Premium Online Marketplace</p>
    <p><a href="${baseUrl}/contact">Contact Us</a> | <a href="${baseUrl}/privacy">Privacy Policy</a></p>
  </div>
</body>
</html>
`;
