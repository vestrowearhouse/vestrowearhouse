import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Row editing from the database explorer has been permanently disabled for security reasons.' },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Row deletion from the database explorer has been permanently disabled for security reasons.' },
    { status: 410 }
  );
}
