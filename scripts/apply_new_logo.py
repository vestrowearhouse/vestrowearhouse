import os
import base64
from PIL import Image, ImageDraw
import numpy as np

img_src = r"C:\Users\tstur\.gemini\antigravity\brain\ebbbc5b2-3a7e-4c69-b2ef-44807e4fc2d6\.user_uploaded\media_1794919688228_a3c02314.jpg"
project_dir = r"D:\VestroWearHouse\Stellar Mart BD"

im = Image.open(img_src).convert("RGBA")

# Step 1: Crop tightly around logo bounding box
cx = (301 + 729) // 2
cy = (355 + 774) // 2
half_size = int(max(729 - 301, 774 - 355) * 0.62)
cropped = im.crop((cx - half_size, cy - half_size, cx + half_size, cy + half_size)).resize((512, 512), Image.Resampling.LANCZOS)

# Step 2: Extract alpha mask
arr = np.array(cropped).astype(float)
gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
alpha = np.clip((248 - gray) / (248 - 25) * 255, 0, 255).astype(np.uint8)

# Transparent black logo
black_logo = np.zeros((512, 512, 4), dtype=np.uint8)
black_logo[:, :, :3] = 0
black_logo[:, :, 3] = alpha
black_logo_img = Image.fromarray(black_logo)

# Transparent WHITE logo
white_logo = np.zeros((512, 512, 4), dtype=np.uint8)
white_logo[:, :, :3] = 255
white_logo[:, :, 3] = alpha
white_logo_img = Image.fromarray(white_logo)

# Step 3: Create Tab Icon - sleek solid BLACK tile with pure WHITE logo (like onfire.fashion)
tile = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
draw = ImageDraw.Draw(tile)
# Solid black rounded rectangle
draw.rounded_rectangle([(0, 0), (512, 512)], radius=110, fill=(0, 0, 0, 255))
scaled_white_logo = white_logo_img.resize((380, 380), Image.Resampling.LANCZOS)
tile.paste(scaled_white_logo, (66, 66), scaled_white_logo)

# Save main tab icons (white logo on black tile)
tile.save(os.path.join(project_dir, "public", "tab-icon.png"))
tile.save(os.path.join(project_dir, "public", "Tab Icon.png"))
tile.save(os.path.join(project_dir, "public", "icon.png"))
tile.save(os.path.join(project_dir, "public", "logo.png"))
tile.save(os.path.join(project_dir, "app", "icon.png"))

# Save brand logos (transparent)
black_logo_img.save(os.path.join(project_dir, "public", "vestro-logo-dark.png"))
white_logo_img.save(os.path.join(project_dir, "public", "vestro-logo-white.png"))

# Save various favicon sizes
tile.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "favicon-16x16.png"))
tile.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "favicon-32x32.png"))
tile.resize((48, 48), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "favicon-48x48.png"))
tile.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "apple-touch-icon.png"))

icons_dir = os.path.join(project_dir, "public", "icons")
os.makedirs(icons_dir, exist_ok=True)
tile.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "apple-touch-icon.png"))
tile.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "icon-192x192.png"))
tile.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "icon-512x512.png"))
tile.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "maskable-icon-192x192.png"))
tile.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "maskable-icon-512x512.png"))

tile.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "icon-192.png"))
tile.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "icon-512.png"))

# Save multi-size ICO
tile.save(os.path.join(project_dir, "public", "favicon.ico"), format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])
tile.save(os.path.join(project_dir, "app", "favicon.ico"), format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])

# Generate SVG favicon with black background and white logo
with open(os.path.join(project_dir, "public", "tab-icon.png"), "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#000000" rx="110" />
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="512" height="512" />
</svg>'''

with open(os.path.join(project_dir, "public", "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)
with open(os.path.join(project_dir, "app", "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)

print("SUCCESS: White logo on black background generated for all tab icons!")
