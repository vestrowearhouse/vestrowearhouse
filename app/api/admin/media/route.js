/**
 * GET  /api/admin/media  — list media from Cloudinary (all folders & real-time sync)
 * POST /api/admin/media  — upload to Cloudinary
 * DELETE /api/admin/media — delete from Cloudinary by publicId
 */
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ── GET — list Cloudinary resources ─────────────────────────────────────────
export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder'); // null or 'all' = all images across all Cloudinary folders
    const maxResults = Math.min(500, parseInt(searchParams.get('max') || '500'));
    const resourceType = searchParams.get('type') || 'image';
    const nextCursor = searchParams.get('cursor');

    const options = {
      type: 'upload',
      resource_type: resourceType,
      max_results: maxResults,
    };

    // If a specific folder is requested (and not 'all'), apply prefix
    if (folder && folder !== 'all') {
      options.prefix = folder === '(root)' ? '' : folder;
    }

    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    // Fetch resources and account usage stats in parallel
    const [result, usageResult] = await Promise.all([
      cloudinary.api.resources(options),
      cloudinary.api.usage().catch(() => null),
    ]);

    const files = (result.resources || []).map(r => {
      const parts = r.public_id.split('/');
      const folderName = parts.length > 1 ? parts.slice(0, -1).join('/') : '(root)';
      return {
        id: r.public_id,
        name: parts.pop(),
        folder: folderName,
        type: r.resource_type === 'video' ? 'video/mp4' : `image/${r.format}`,
        size: formatFileSize(r.bytes),
        rawSize: r.bytes,
        date: new Date(r.created_at).toLocaleDateString(),
        createdAt: r.created_at,
        url: r.secure_url,
        publicId: r.public_id,
        width: r.width,
        height: r.height,
        format: r.format,
      };
    });

    // Detect unique folders from resources
    const foldersSet = new Set(['all']);
    files.forEach(f => {
      if (f.folder) foldersSet.add(f.folder);
    });

    return NextResponse.json(
      {
        files,
        total: files.length,
        nextCursor: result.next_cursor || null,
        folders: Array.from(foldersSet),
        usage: usageResult ? {
          plan: usageResult.plan || 'Free',
          storageBytes: usageResult.storage?.usage || 0,
          storageCredits: usageResult.storage?.credits_usage || 0,
          creditsUsed: usageResult.credits?.usage || 0,
          creditsLimit: usageResult.credits?.limit || 25,
          creditsUsedPercent: usageResult.credits?.used_percent || 0,
          objectsCount: usageResult.objects?.usage || files.length,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'do56bvtzt',
        } : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Media GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch media from Cloudinary' }, { status: 500 });
  }
}

// ── POST — upload to Cloudinary ──────────────────────────────────────────────
export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'stellar-mart';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isVideo = file.type?.startsWith('video/');
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadToCloudinary(buffer, {
      folder,
      resourceType: isVideo ? 'video' : 'image',
      mimeType: file.type,
      transformation: isVideo
        ? []
        : [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }],
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      ...result,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Failed to upload media to Cloudinary' }, { status: 500 });
  }
}

// ── DELETE — remove from Cloudinary ─────────────────────────────────────────
export async function DELETE(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let publicId = null;
    let resourceType = 'image';

    const { searchParams } = new URL(request.url);
    if (searchParams.get('publicId')) {
      publicId = searchParams.get('publicId');
      resourceType = searchParams.get('type') || 'image';
    } else {
      try {
        const body = await request.json();
        publicId = body.publicId;
        resourceType = body.resourceType || 'image';
      } catch (e) {}
    }

    if (!publicId) return NextResponse.json({ error: 'publicId required' }, { status: 400 });

    await deleteFromCloudinary(publicId, resourceType || 'image');
    return NextResponse.json({ success: true, publicId });
  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json({ error: 'Failed to delete media from Cloudinary' }, { status: 500 });
  }
}