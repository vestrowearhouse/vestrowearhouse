import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Send a test email
    await sendEmail(
      email,
      '✅ StellarMartBD Email Test',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4f46e5;">Email Test Successful! 🎉</h1>
        <p>If you're seeing this email, your StellarMartBD email configuration is working correctly.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email Service:</strong> Gmail SMTP (Nodemailer)</p>
          <p><strong>Sent to:</strong> ${email}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>You can now use:</p>
        <ul>
          <li>✉️ Welcome emails on registration</li>
          <li>👋 Welcome back emails on login</li>
          <li>🔐 OTP emails for password reset</li>
        </ul>
        <p style="color: #666; margin-top: 30px;">StellarMartBD Team</p>
      </div>
      `
    );

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}. Please check your inbox!`
    });

  } catch (error) {
    console.error('Test email error:', error);
    
    // Provide helpful error messages for common issues
    let errorMessage = 'Failed to send test email';
    
    if (error.message?.includes('EMAIL_USER')) {
      errorMessage = 'Email configuration missing. Please check your .env file has EMAIL_USER and EMAIL_PASS set.';
    } else if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your Gmail App Password is correct.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Please check your internet connection and EMAIL_HOST/EMAIL_PORT settings.';
    } else if (error.message?.includes('Invalid login')) {
      errorMessage = 'Invalid Gmail credentials. Make sure you are using an App Password, not your regular Gmail password.';
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
