/**
 * Cloudinary Upload Utility
 * Handles server-side Cloudinary uploads with optimization
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a buffer or base64 string to Cloudinary
 * @param {Buffer|string} fileData - File buffer or base64 data URI
 * @param {object} options - Upload options
 * @returns {Promise<{url, publicId, type}>}
 */
export async function uploadToCloudinary(fileData, options = {}) {
  const {
    folder = 'stellar-mart',
    resourceType = 'auto',    // 'image' | 'video' | 'auto'
    transformation = [],
  } = options;

  // Convert Buffer to base64 data URI if needed
  let uploadData = fileData;
  if (Buffer.isBuffer(fileData)) {
    const base64 = fileData.toString('base64');
    const mimeType = options.mimeType || 'image/jpeg';
    uploadData = `data:${mimeType};base64,${base64}`;
  }

  const result = await cloudinary.uploader.upload(uploadData, {
    folder,
    resource_type: resourceType,
    transformation,
    quality: 'auto',
    fetch_format: 'auto',
    flags: 'progressive',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    type: result.resource_type === 'video' ? 'video' : 'image',
    thumbnail: result.resource_type === 'video'
      ? cloudinary.url(result.public_id, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [{ width: 400, height: 400, crop: 'fill' }],
          secure: true,
        })
      : null,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

/**
 * Delete a file from Cloudinary by publicId
 * @param {string} publicId
 * @param {string} resourceType 'image' | 'video'
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Generate a signed upload URL for direct client-side uploads (optional)
 */
export function getSignedUploadParams(folder = 'stellar-mart/reviews') {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder,
    quality: 'auto',
    fetch_format: 'auto',
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  };
}

export default cloudinary;
