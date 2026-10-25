import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { revalidatePath, revalidateTag } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { recordCachePurge } from '@/lib/mongo';

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

      await Promise.allSettled([
        logActivity({
          action: 'CACHE_PURGE',
          resource: 'cache',
          resourceId: 'all',
          description: 'Purged global site cache',
          details: { scope: 'all' },
          req: request,
        }),
        recordCachePurge({
          scope: 'all',
          actor: 'admin',
          result: 'success',
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Global site cache purged successfully.'
      });
    }

    if (action === 'clear_path') {
      revalidatePath(path || '/');

      await Promise.allSettled([
        logActivity({
          action: 'CACHE_PURGE',
          resource: 'cache',
          resourceId: path || '/',
          description: `Purged cache for path ${path || '/'}`,
          details: { scope: path || '/' },
          req: request,
        }),
        recordCachePurge({
          scope: path === '/' ? 'homepage' : (path || 'all'),
          actor: 'admin',
          result: 'success',
        }),
      ]);

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