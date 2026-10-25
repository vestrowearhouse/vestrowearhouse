import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Table deletion from the web admin panel has been permanently disabled for security reasons.' },
    { status: 410 }
  );
}
