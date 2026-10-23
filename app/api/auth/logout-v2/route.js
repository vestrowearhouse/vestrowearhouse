import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logout successful', success: true },
    { status: 200 }
  );

  // Expire both customer and admin cookies.
  // Use identical cookie attributes as login to ensure it works on Vercel/secure contexts.
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set('token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure,
  });

  response.cookies.set('adminToken', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure,
  });

  // Sometimes browsers keep multiple cookie variants; provide explicit deletion attempts.
  // These attributes match our set() usage.
  response.cookies.delete('token');
  response.cookies.delete('adminToken');

  return response;
}

