import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const response = NextResponse.json(
      { message: 'Logout successful', success: true },
      { status: 200 }
    );
    
    // Clear token cookie - make sure it's completely deleted
    response.cookies.set('token', '', {
      httpOnly: true,
      maxAge: 0,  // Immediately expire
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    // Also clear adminToken if exists
    response.cookies.set('adminToken', '', {
      httpOnly: true,
      maxAge: 0,  // Immediately expire
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    return response;
  } catch (error) {
    console.error('[Logout] Error:', error);
    return NextResponse.json(
      { message: 'Logout error', error: 'Internal server error' },
      { status: 500 }
    );
  }
}
