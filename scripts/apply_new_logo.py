import os
import base64
from PIL import Image, ImageDraw
import numpy as np

img_src = r"C:\Users\tstur\.gemini\antigravity\brain\ebbbc5b2-3a7e-4c69-b2ef-44807e4fc2d6\.user_uploaded\media_1794919688228_a3c02314.jpg"
project_dir = r"D:\VestroWearHouse\Stellar Mart BD"

im = Image.open(img_src).convert("RGBA")

# Extract the black V logo cleanly
arr = np.array(im).astype(float)
gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
alpha = np.clip((248 - gray) / (248 - 25) * 255, 0, 255).astype(np.uint8)

black_full = np.zeros((1024, 1024, 4), dtype=np.uint8)
black_full[:, :, :3] = 0
black_full[:, :, 3] = alpha
black_full_img = Image.fromarray(black_full)

white_full = np.zeros((1024, 1024, 4), dtype=np.uint8)
white_full[:, :, :3] = 255
white_full[:, :, 3] = alpha
white_full_img = Image.fromarray(white_full)

# Crop tight bounding box of V
v_crop_black = black_full_img.crop((302, 356, 728, 774)) # 426x418
v_crop_white = white_full_img.crop((302, 356, 728, 774))

# -------------------------------------------------------------
# Function to generate supersampled circular badge
# -------------------------------------------------------------
def make_circular_badge(bg_color, v_img):
    canvas_size = 2048
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    pad = 24
    draw.ellipse([pad, pad, canvas_size - pad, canvas_size - pad], fill=bg_color)

    # V logo occupies ~62% of circle diameter for balanced golden ratio padding
    v_target_size = int((canvas_size - 2 * pad) * 0.62)
    v_h = int(v_target_size * 418 / 426)
    v_resized = v_img.resize((v_target_size, v_h), Image.Resampling.LANCZOS)

    vx = (canvas_size - v_resized.width) // 2
    vy = (canvas_size - v_resized.height) // 2

    canvas.paste(v_resized, (vx, vy), v_resized)
    return canvas.resize((512, 512), Image.Resampling.LANCZOS)

# 1. Main Circular Logo: Pure White Circle Background (#FFFFFF) + Deep Black V (#000000)
circle_white_bg = make_circular_badge((255, 255, 255, 255), v_crop_black)

# 2. Dark Theme Circular Logo: Black Circle Background (#000000) + White V (#FFFFFF)
circle_black_bg = make_circular_badge((0, 0, 0, 255), v_crop_white)

# 3. Transparent V logos for direct placement
v_transparent_black = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
v_fit_black = v_crop_black.resize((360, int(360 * 418 / 426)), Image.Resampling.LANCZOS)
v_transparent_black.paste(v_fit_black, ((512 - v_fit_black.width)//2, (512 - v_fit_black.height)//2), v_fit_black)

v_transparent_white = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
v_fit_white = v_crop_white.resize((360, int(360 * 418 / 426)), Image.Resampling.LANCZOS)
v_transparent_white.paste(v_fit_white, ((512 - v_fit_white.width)//2, (512 - v_fit_white.height)//2), v_fit_white)

# Save main circular tab icons
circle_white_bg.save(os.path.join(project_dir, "public", "tab-icon.png"))
circle_white_bg.save(os.path.join(project_dir, "public", "Tab Icon.png"))
circle_white_bg.save(os.path.join(project_dir, "public", "icon.png"))
circle_white_bg.save(os.path.join(project_dir, "public", "logo.png"))

# Save brand logos for dark and light UI
circle_white_bg.save(os.path.join(project_dir, "public", "vestro-logo-dark.png"))
circle_black_bg.save(os.path.join(project_dir, "public", "vestro-logo-white.png"))

# Save favicons with circle shape
circle_white_bg.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "favicon-16x16.png"))
circle_white_bg.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "favicon-32x32.png"))
circle_white_bg.resize((48, 48), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "favicon-48x48.png"))
circle_white_bg.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "apple-touch-icon.png"))

icons_dir = os.path.join(project_dir, "public", "icons")
os.makedirs(icons_dir, exist_ok=True)
circle_white_bg.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "apple-touch-icon.png"))
circle_white_bg.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "icon-192x192.png"))
circle_white_bg.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "icon-512x512.png"))
circle_white_bg.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "maskable-icon-192x192.png"))
circle_white_bg.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "maskable-icon-512x512.png"))

circle_white_bg.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "icon-192.png"))
circle_white_bg.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(project_dir, "public", "icon-512.png"))

# Multi-resolution ICO
circle_white_bg.save(os.path.join(project_dir, "public", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# Generate SVG favicon (Circular White Background + Black V)
with open(os.path.join(project_dir, "public", "tab-icon.png"), "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64}" width="512" height="512" />
</svg>'''

with open(os.path.join(project_dir, "public", "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)

print("SUCCESS: 100% Circle shape logo with white background & black V generated across all icon files!")
