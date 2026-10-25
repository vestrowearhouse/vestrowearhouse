import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'SQL Console and raw SQL query execution have been permanently disabled for security reasons.' 
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'SQL Console and raw SQL query execution have been permanently disabled for security reasons.' 
    },
    { status: 410 }
  );
}