import sendEmail from './email.js';
import { welcomeEmailHTML, otpEmailHTML, resetSuccessHTML, emailVerificationHTML } from './emailTemplates.js';
import crypto from 'crypto';

export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to StellarMartBD!';
  const html = welcomeEmailHTML(name);
  await sendEmail(email, subject, html);
};

export const sendOtpEmail = async (email, name, otp) => {
  const subject = 'Your Password Reset OTP - StellarMartBD';
  const html = otpEmailHTML(name, otp);
  await sendEmail(email, subject, html);
};

export const sendResetSuccessEmail = async (email, name) => {
  const subject = 'Password Reset Successful';
  const html = resetSuccessHTML(name);
  await sendEmail(email, subject, html);
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
