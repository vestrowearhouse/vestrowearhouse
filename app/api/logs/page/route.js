import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const goneResponse = () =>
  NextResponse.json(
    {
      success: false,
      error: 'This logging endpoint has been retired and is permanently gone. Direct API log ingestion is disabled for security.',
    },
    { status: 410 }
  );

export async function GET() {
  return goneResponse();
}

export async function POST() {
  return goneResponse();
}

export async function PUT() {
  return goneResponse();
}

export async function DELETE() {
  return goneResponse();
}
