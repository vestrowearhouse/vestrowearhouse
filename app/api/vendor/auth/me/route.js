import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('[vendorAuth] JWT_SECRET is not configured or too short.');
  }
  return secret;
}

export async function GET(request) {
  try {
    const token = request.cookies.get('vendorToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    if (decoded.role !== 'vendor') {
      return NextResponse.json({ error: 'Not a vendor session' }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: decoded.id,
        username: decoded.shop_name || decoded.email,
        vendor_id: decoded.vendor_id,
        shop_name: decoded.shop_name,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (error) {
    console.error('Vendor auth me error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
