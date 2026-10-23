import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const decoded = await verifyAdminToken(request);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return admin user info
    return NextResponse.json({
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      }
    });
  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}