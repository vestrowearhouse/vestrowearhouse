/**
 * lib/validation.js
 * Server-side input validation & sanitization using Zod.
 * Centralizes all schema definitions so each API route stays thin.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────
// Sanitization helpers
// ─────────────────────────────────────────────

/**
 * Strip HTML tags and dangerous characters from a string.
 * Prevents XSS when output is later rendered as HTML.
 */
export function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove null bytes that can bypass filters
    .replace(/\0/g, '')
    .trim();
}

/**
 * Detect obvious SQL injection patterns (defense-in-depth — Supabase
 * already uses parameterized queries, but this catches crafted inputs early).
 */
export function containsSQLInjection(value) {
  if (typeof value !== 'string') return false;
  const sqlPatterns = /('|--|;|\/\*|\*\/|xp_|DROP\s|SELECT\s|INSERT\s|UPDATE\s|DELETE\s|UNION\s|EXEC\s|EXECUTE\s|ALTER\s|CAST\s)/i;
  return sqlPatterns.test(value);
}

// ─────────────────────────────────────────────
// Password policy
// ─────────────────────────────────────────────

const PASSWORD_MIN = 8;

/**
 * Strong password: min 8 chars, at least 1 uppercase, 1 lowercase,
 * 1 digit, 1 special character.
 */
export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `পাসওয়ার্ড কমপক্ষে ${PASSWORD_MIN} অক্ষরের হতে হবে`)
  .max(128, 'পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে পারবে')
  .refine((val) => /[A-Z]/.test(val), { message: 'পাসওয়ার্ডে অন্তত একটি বড় হাতের অক্ষর থাকতে হবে (A-Z)' })
  .refine((val) => /[a-z]/.test(val), { message: 'পাসওয়ার্ডে অন্তত একটি ছোট হাতের অক্ষর থাকতে হবে (a-z)' })
  .refine((val) => /[0-9]/.test(val), { message: 'পাসওয়ার্ডে অন্তত একটি সংখ্যা থাকতে হবে (0-9)' })
  .refine((val) => /[^A-Za-z0-9]/.test(val), { message: 'পাসওয়ার্ডে অন্তত একটি বিশেষ চিহ্ন থাকতে হবে (!@#$%^&*)' });

/**
 * Customer password: min 6 chars, practical and standard for e-commerce.
 */
export const customerPasswordSchema = z
  .string({ required_error: 'পাসওয়ার্ড দিন' })
  .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
  .max(128, 'পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে পারবে');

// ─────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'ইমেইল বা ফোন নম্বর দিন' })
    .min(1, 'ইমেইল বা ফোন নম্বর দিন')
    .max(254, 'ইনপুট অনেক বড়')
    .transform((val) => val.trim()),
  password: z
    .string({ required_error: 'পাসওয়ার্ড দিন' })
    .min(1, 'পাসওয়ার্ড দিন')
    .max(128, 'পাসওয়ার্ড অনেক বড়'),
});

export const adminLoginSchema = z.object({
  username: z
    .string({ required_error: 'ইউজারনেম বা ইমেইল দিন' })
    .min(1, 'ইউজারনেম বা ইমেইল দিন')
    .max(254)
    .transform((val) => val.trim()),
  password: z
    .string({ required_error: 'পাসওয়ার্ড দিন' })
    .min(1, 'পাসওয়ার্ড দিন')
    .max(128),
});

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'নাম দিন' })
    .min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে')
    .max(100, 'নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারবে')
    .refine((val) => !containsSQLInjection(val), { message: 'নামে অবৈধ চিহ্ন রয়েছে' })
    .transform(sanitizeString),
  email: z
    .string({ required_error: 'ইমেইল দিন' })
    .email('সঠিক ইমেইল ঠিকানা দিন')
    .max(254)
    .transform((val) => val.toLowerCase().trim()),
  password: customerPasswordSchema,
  phone: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .transform((val) => (val ? val.replace(/[^0-9+\-() ]/g, '').trim() : null)),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'ইমেইল দিন' })
    .email('সঠিক ইমেইল ঠিকানা দিন')
    .max(254)
    .transform((val) => val.toLowerCase().trim()),
});

// ─────────────────────────────────────────────
// Validation helper — returns { success, data, error }
// ─────────────────────────────────────────────

/**
 * Validate a request body against a Zod schema.
 *
 * @param {z.ZodSchema} schema
 * @param {unknown}     data   — usually `await request.json()`
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Return the first human-readable error message only
  const firstError = result.error.errors[0]?.message || 'Invalid input';
  return { success: false, error: firstError };
}
