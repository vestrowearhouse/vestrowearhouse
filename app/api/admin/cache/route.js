import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';



export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      cache: {
        enabled: true,
        size: '512 MB',
        hitRate: 85.5,
        items: 1024
      }
    });
  } catch (error) {
    console.error('Cache error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache info' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { action, path } = await request.json();

    if (action === 'clear_all') {
      revalidatePath('/', 'layout');
      return NextResponse.json({
        success: true,
        message: 'Global site cache purged successfully.'
      });
    }

    if (action === 'clear_path') {
      revalidatePath(path || '/');
      return NextResponse.json({
        success: true,
        message: `Cache for path ${path || '/'} refreshed.`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Cache operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform cache operation' },
      { status: 500 }
    );
  }
}