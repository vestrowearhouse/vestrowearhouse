import nodemailer from 'nodemailer';

/**
 * Sends an email using Zoho's SMTP server with Nodemailer.
 * Uses the App Password for authentication.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML body of the email.
 * @param {string|null} replyTo - Optional email address for replies.
 */
export async function sendEmailWithZoho(to, subject, html, replyTo = null) {
  const { ZOHO_EMAIL, ZOHO_APP_PASSWORD } = process.env;

  if (!ZOHO_EMAIL || !ZOHO_APP_PASSWORD) {
    throw new Error('Zoho SMTP credentials (ZOHO_EMAIL, ZOHO_APP_PASSWORD) are not set in environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: ZOHO_EMAIL,
      pass: ZOHO_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"StellarMartBD Support" <${ZOHO_EMAIL}>`,
    to,
    subject,
    html,
    ...(replyTo && { replyTo }),
  };

  return transporter.sendMail(mailOptions);
}