import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const idArray = resolvedParams?.id;
    if (!idArray || idArray.length === 0) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 });
    }

    // Join array to reconstruct full Cloudinary public_id (e.g. 'stellar-mart/banners/default_banner_1')
    const publicId = Array.isArray(idArray) ? idArray.join('/') : String(idArray);

    await deleteFromCloudinary(publicId, 'image');

    return NextResponse.json({ success: true, publicId });
  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json({ error: 'Failed to delete media from Cloudinary' }, { status: 500 });
  }
}
