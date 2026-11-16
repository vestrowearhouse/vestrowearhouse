import os
import base64
from PIL import Image
import numpy as np

src_path = r'C:/Users/tstur/.gemini/antigravity/brain/ebbbc5b2-3a7e-4c69-b2ef-44807e4fc2d6/.user_uploaded/media_1794833242899_2f959a8a.jpg'
pub_dir = r'D:\VestroWearHouse\Stellar Mart BD\public'
icons_dir = os.path.join(pub_dir, 'icons')
os.makedirs(icons_dir, exist_ok=True)

img = Image.open(src_path).convert('RGB')
gray = np.array(img.convert('L'), dtype=np.float32)

mask = gray < 200
ymin, ymax = np.where(np.any(mask, axis=1))[0][[0, -1]]
xmin, xmax = np.where(np.any(mask, axis=0))[0][[0, -1]]

cx = (xmin + xmax) / 2.0
cy = (ymin + ymax) / 2.0
max_dim = max(xmax - xmin, ymax - ymin)

pad = max_dim * 0.12
half_size = (max_dim / 2.0) + pad
crop_box = (
    int(round(max(0, cx - half_size))),
    int(round(max(0, cy - half_size))),
    int(round(min(img.width, cx + half_size))),
    int(round(min(img.height, cy + half_size)))
)

cropped = img.crop(crop_box)
master_square = cropped.resize((1024, 1024), Image.Resampling.LANCZOS)
master_gray = np.array(master_square.convert('L'), dtype=np.float32)

alpha = np.clip((245.0 - master_gray) / (245.0 - 35.0) * 255.0, 0, 255).astype(np.uint8)

# 1. Black transparent
rgba_black = np.zeros((1024, 1024, 4), dtype=np.uint8)
rgba_black[:, :, 0] = 17
rgba_black[:, :, 1] = 24
rgba_black[:, :, 2] = 39
rgba_black[:, :, 3] = alpha
img_black_trans = Image.fromarray(rgba_black, 'RGBA')

# 2. White transparent
rgba_white = np.zeros((1024, 1024, 4), dtype=np.uint8)
rgba_white[:, :, 0] = 255
rgba_white[:, :, 1] = 255
rgba_white[:, :, 2] = 255
rgba_white[:, :, 3] = alpha
img_white_trans = Image.fromarray(rgba_white, 'RGBA')

# 3. White background solid
img_white_bg = Image.new('RGB', (1024, 1024), (255, 255, 255))
img_white_bg.paste(img_black_trans, (0, 0), img_black_trans)

def save_png(im, path, size):
    resized = im.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, format='PNG')

# 512x512 transparent
save_png(img_black_trans, os.path.join(pub_dir, 'logo.png'), 512)
save_png(img_black_trans, os.path.join(pub_dir, 'brand-monogram.png'), 512)
save_png(img_black_trans, os.path.join(pub_dir, 'tab-icon.png'), 512)
save_png(img_black_trans, os.path.join(pub_dir, 'Tab Icon.png'), 512)
save_png(img_black_trans, os.path.join(pub_dir, 'stellar-logo-mark.png'), 512)
save_png(img_black_trans, os.path.join(pub_dir, 'stellar-logo-full.png'), 512)
save_png(img_black_trans, os.path.join(pub_dir, 'vestro-logo-dark.png'), 512)
save_png(img_white_trans, os.path.join(pub_dir, 'vestro-logo-white.png'), 512)

# Favicons
save_png(img_black_trans, os.path.join(pub_dir, 'favicon-16x16.png'), 16)
save_png(img_black_trans, os.path.join(pub_dir, 'favicon-32x32.png'), 32)
save_png(img_black_trans, os.path.join(pub_dir, 'favicon-48x48.png'), 48)

# Multi-resolution ICO
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
img_black_trans.save(os.path.join(pub_dir, 'favicon.ico'), format='ICO', sizes=ico_sizes)

# Solid white bg icons for PWA & Apple Touch
img_white_bg.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(pub_dir, 'favicon.jpg'), format='JPEG', quality=95)
save_png(img_white_bg, os.path.join(pub_dir, 'icon-192.png'), 192)
save_png(img_white_bg, os.path.join(pub_dir, 'icon-512.png'), 512)
save_png(img_white_bg, os.path.join(pub_dir, 'apple-touch-icon.png'), 180)

save_png(img_white_bg, os.path.join(icons_dir, 'icon-192x192.png'), 192)
save_png(img_white_bg, os.path.join(icons_dir, 'icon-512x512.png'), 512)
save_png(img_white_bg, os.path.join(icons_dir, 'apple-touch-icon.png'), 180)
save_png(img_white_bg, os.path.join(icons_dir, 'maskable-icon-192x192.png'), 192)
save_png(img_white_bg, os.path.join(icons_dir, 'maskable-icon-512x512.png'), 512)

# SVG favicon
with open(os.path.join(pub_dir, 'logo.png'), 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('ascii')
svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64}" width="512" height="512" />
</svg>'''
with open(os.path.join(pub_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('All Vestro Wear House brand assets successfully generated!')
