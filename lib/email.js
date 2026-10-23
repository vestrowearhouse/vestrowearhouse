import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

const FROM_EMAIL = process.env.FROM_EMAIL || 'StellarMartBD <support@stellarmartbd.com>';

export const sendEmail = async (to, subject, html) => {
  try {
    // Validate required environment variables
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      reply_to: 'stellarmartbd@gmail.com', // ইউজার রিপ্লাই দিলে এই জিমেইলে আসবে
    });

    console.log('Email sent successfully via Resend:', data.id);
    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const { welcomeEmailHTML } = await import('./emailTemplates.js');
  const html = welcomeEmailHTML(name);
  return sendEmail(email, '🎉 Welcome to StellarMartBD!', html);
};

export const sendLoginWelcomeEmail = async (email, name, loginTime, device, ipAddress) => {
  const { loginWelcomeEmailHTML } = await import('./emailTemplates.js');
  const html = loginWelcomeEmailHTML(name, loginTime, device, ipAddress);
  return sendEmail(email, '👋 Welcome Back to StellarMartBD', html);
};

export const sendOtpEmail = async (email, name, otp) => {
  const { otpEmailHTML } = await import('./emailTemplates.js');
  const html = otpEmailHTML(name, otp);
  return sendEmail(email, '🔐 Your Password Reset Code', html);
};

export const sendResetSuccessEmail = async (email, name) => {
  const { resetSuccessHTML } = await import('./emailTemplates.js');
  const html = resetSuccessHTML(name);
  return sendEmail(email, '✅ Password Reset Successful', html);
};

export default sendEmail;
