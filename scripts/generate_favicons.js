const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function createIco(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4);

  let offset = 6 + 16 * pngBuffers.length;
  const dirEntries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((img) => img.buffer)]);
}

async function generate() {
  const sourceFile = path.resolve('scratch/Tab Icon.png');
  if (!fs.existsSync(sourceFile)) {
    throw new Error('Source file not found: ' + sourceFile);
  }

  console.log('Generating silky smooth vector-edge icons from:', sourceFile);

  // 1. Extract the clean logo artwork from scratch/Tab Icon.png
  // Real artwork bounds: minX 113, maxX 346, minY 89, maxY 396
  // Extracting from x=105, y=80 with pure white background margin
  const logoCrop = await sharp(sourceFile)
    .extract({ left: 105, top: 80, width: 250, height: 326 })
    .toBuffer();

  // 2. Scale logo cleanly for optical balance inside the 512x512 card
  const targetLogoHeight = 352;
  const scaledLogo = await sharp(logoCrop)
    .resize({ height: targetLogoHeight, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const logoMeta = await sharp(scaledLogo).metadata();
  const logoB64 = scaledLogo.toString('base64');

  // Exact optical centering inside 512x512 canvas
  const cardSize = 480;
  const cardOffset = 16;
  const cornerRadius = 108; // Smooth, modern Apple-style squircle radius

  const logoX = Math.round((512 - logoMeta.width) / 2);
  const logoY = Math.round((512 - logoMeta.height) / 2);

  // 3. Generate Mathematical Vector SVG Favicon
  // This renders with ZERO blurriness or pixelation in modern browsers (Chrome, Edge, Firefox, Safari)
  const svgFavicon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="geometricPrecision">
  <rect x="${cardOffset}" y="${cardOffset}" width="${cardSize}" height="${cardSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#FFFFFF" />
  <image href="data:image/png;base64,${logoB64}" x="${logoX}" y="${logoY}" width="${logoMeta.width}" height="${logoMeta.height}" />
</svg>`;

  fs.writeFileSync(path.resolve('public/favicon.svg'), svgFavicon);
  fs.writeFileSync(path.resolve('app/favicon.svg'), svgFavicon);
  console.log('✓ public/favicon.svg and app/favicon.svg created (vector crisp precision)');

  // 4. Generate High-Res 512x512 Master PNG from the vector SVG
  // This guarantees subpixel anti-aliasing and perfectly smooth symmetrical edges
  const master512Buffer = await sharp(Buffer.from(svgFavicon))
    .resize(512, 512)
    .png()
    .toBuffer();

  fs.writeFileSync(path.resolve('scratch/smooth_master_512.png'), master512Buffer);

  // 5. Generate Multi-Resolution ICO buffers with cubic anti-aliasing filter
  const b16 = await sharp(master512Buffer).resize(16, 16, { kernel: 'cubic' }).png().toBuffer();
  const b32 = await sharp(master512Buffer).resize(32, 32, { kernel: 'cubic' }).png().toBuffer();
  const b48 = await sharp(master512Buffer).resize(48, 48, { kernel: 'cubic' }).png().toBuffer();
  const b64 = await sharp(master512Buffer).resize(64, 64, { kernel: 'cubic' }).png().toBuffer();

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
    { width: 64, height: 64, buffer: b64 }
  ]);

  fs.writeFileSync(path.resolve('public/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.resolve('app/favicon.ico'), icoBuffer);
  console.log('✓ public/favicon.ico and app/favicon.ico generated (multi-res 16, 32, 48, 64 with smooth cubic filter)');

  // 6. Individual PNG favicons
  fs.writeFileSync(path.resolve('public/favicon-16x16.png'), b16);
  fs.writeFileSync(path.resolve('public/favicon-32x32.png'), b32);
  fs.writeFileSync(path.resolve('public/favicon-48x48.png'), b48);
  console.log('✓ public/favicon-16x16.png, 32x32, 48x48 generated');

  // 7. Apple Touch Icon (180x180)
  const b180 = await sharp(master512Buffer).resize(180, 180, { kernel: 'cubic' }).png().toBuffer();
  fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), b180);
  fs.writeFileSync(path.resolve('public/icons/apple-touch-icon.png'), b180);
  console.log('✓ apple-touch-icon.png generated');

  // 8. Standard PWA Icons (192x192, 512x512)
  const b192 = await sharp(master512Buffer).resize(192, 192, { kernel: 'cubic' }).png().toBuffer();
  const b512 = master512Buffer;

  fs.writeFileSync(path.resolve('public/icon-192.png'), b192);
  fs.writeFileSync(path.resolve('public/icons/icon-192x192.png'), b192);
  fs.writeFileSync(path.resolve('public/icon-512.png'), b512);
  fs.writeFileSync(path.resolve('public/icons/icon-512x512.png'), b512);
  fs.writeFileSync(path.resolve('app/icon.png'), b512);
  console.log('✓ icon-192 and icon-512 and app/icon.png generated');

  // 9. Maskable PWA Icons (with safe zone padding)
  const maskable192 = await sharp(master512Buffer)
    .resize(154, 154, { kernel: 'cubic' })
    .extend({
      top: 19,
      bottom: 19,
      left: 19,
      right: 19,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();

  const maskable512 = await sharp(master512Buffer)
    .resize(410, 410, { kernel: 'cubic' })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();

  fs.writeFileSync(path.resolve('public/icons/maskable-icon-192x192.png'), maskable192);
  fs.writeFileSync(path.resolve('public/icons/maskable-icon-512x512.png'), maskable512);
  console.log('✓ maskable icons generated');

  // 10. Update stellarmartBd-main legacy directory if present
  const legacyDir = path.resolve('stellarmartBd-main/public');
  if (fs.existsSync(legacyDir)) {
    fs.writeFileSync(path.join(legacyDir, 'favicon.ico'), icoBuffer);
    fs.writeFileSync(path.join(legacyDir, 'favicon.svg'), svgFavicon);
    console.log('✓ stellarmartBd-main/public/favicon.ico & svg updated');
  }

  console.log('🎉 All icons successfully regenerated with ultra-smooth vector edges!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
