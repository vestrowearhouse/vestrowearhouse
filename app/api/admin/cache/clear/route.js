import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { path } = await request.json();
    
    // Clear the cache for the specific path, or root if not provided
    const pathToRevalidate = path || '/';
    revalidatePath(pathToRevalidate, 'layout');
    
    return NextResponse.json({
      success: true,
      message: `Cache cleared for path: ${pathToRevalidate}`,
      revalidated: true,
      now: Date.now()
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
