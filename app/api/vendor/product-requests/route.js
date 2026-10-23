import { NextResponse } from 'next/server';

// Vendor product requests system has been removed.
// Vendor products are now stored directly in the vendor_products table.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ error: 'Product request system has been removed. Use /api/vendor/products instead.' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: 'Product request system has been removed. Use /api/vendor/products instead.' }, { status: 410 });
}
