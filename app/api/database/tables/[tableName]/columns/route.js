import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Column modification from the web admin panel has been permanently disabled for security reasons.' },
    { status: 410 }
  );
}
